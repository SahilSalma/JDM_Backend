import { sqlite } from '../config/database';
import { db } from '../config/database';
import { products } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../middleware/logger';

export interface SearchResult {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price_cents: number;
  primary_image_path: string | null;
  make: string | null;
  model: string | null;
  category: string;
  rank?: number;
}

async function indexProduct(productId: string): Promise<void> {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return;

  try {
    // Delete existing FTS record
    sqlite.prepare('DELETE FROM products_fts WHERE product_id = ?').run(productId);

    // Build a years string covering year_start–year_end so users can search by year.
    let years = '';
    if (product.year_start && product.year_end) {
      const start = product.year_start;
      const end = Math.min(product.year_end, start + 30); // cap range to avoid huge tokens
      const list: string[] = [];
      for (let y = start; y <= end; y++) list.push(String(y));
      years = list.join(' ');
    } else if (product.year_start) {
      years = String(product.year_start);
    }

    // Insert/re-index the product
    sqlite
      .prepare(
        `INSERT INTO products_fts (product_id, title, description, sku, make, model, engine_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        product.id,
        `${product.title ?? ''} ${years}`.trim(),
        product.description ?? '',
        product.sku ?? '',
        product.make ?? '',
        product.model ?? '',
        product.engine_code ?? '',
      );
  } catch (err) {
    logger.warn({ err, productId }, 'Failed to index product in FTS');
  }
}

/** Ensure every active product is indexed. Called lazily on first search. */
let bulkIndexed = false;
async function ensureBulkIndexed(): Promise<void> {
  if (bulkIndexed) return;
  try {
    const allProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.is_deleted, false), eq(products.status, 'active')));
    for (const p of allProducts) {
      await indexProduct(p.id);
    }
    bulkIndexed = true;
  } catch (err) {
    logger.warn({ err }, 'Bulk FTS indexing failed');
  }
}

async function searchProducts(query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  await ensureBulkIndexed();

  try {
    // Sanitize query for FTS5 — wrap in quotes if it contains special chars, then add wildcard
    const sanitizedQuery = query.replace(/['"*]/g, '').trim();
    if (!sanitizedQuery) return [];

    // Tokenize so multi-word queries (e.g. "honda 2010 k24") match all tokens.
    const tokens = sanitizedQuery.split(/\s+/).filter(Boolean);
    const ftsQuery = tokens.map((t) => `${t}*`).join(' ');

    const ftsResults = sqlite
      .prepare(
        `SELECT product_id, rank
         FROM products_fts
         WHERE products_fts MATCH ?
         ORDER BY rank
         LIMIT ?`,
      )
      .all(ftsQuery, limit) as Array<{ product_id: string; rank: number }>;

    if (!ftsResults.length) return [];

    const productIds = ftsResults.map((r) => r.product_id);
    const rankMap = new Map(ftsResults.map((r) => [r.product_id, r.rank]));

    const productRows = await db
      .select({
        id: products.id,
        sku: products.sku,
        slug: products.slug,
        title: products.title,
        price_cents: products.price_cents,
        primary_image_path: products.primary_image_path,
        make: products.make,
        model: products.model,
        category: products.category,
      })
      .from(products)
      .where(and(eq(products.is_deleted, false), eq(products.status, 'active')));

    const filtered = productRows
      .filter((p) => productIds.includes(p.id))
      .map((p) => ({ ...p, rank: rankMap.get(p.id) }))
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

    return filtered;
  } catch (err) {
    logger.warn({ err, query }, 'FTS search error');
    return [];
  }
}

export const searchService = {
  indexProduct,
  searchProducts,
};
