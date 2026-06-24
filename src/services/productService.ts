import { eq, and, like, sql, desc, asc, isNull, or, inArray } from 'drizzle-orm';
import { db } from '../config/database';
import { products, productImages, productCompatibility } from '../models/schema';
import type { NewProduct, NewProductCompatibility } from '../models/schema';
import { generateSlug } from '../utils/slug';
import { createError } from '../middleware/errorHandler';
import { searchService } from './searchService';
import { getSettingValue } from './settingsService';
import { syncProduct, deleteProductFromMerchant } from './merchantService';
import { logger } from '../middleware/logger';
import { enrichImage } from './imageService';

function mapProductStatus<T extends { status: string }>(product: T): T {
  return {
    ...product,
    status: (product.status === 'inactive' ? 'draft' : product.status) as any,
  };
}

export interface ProductFilters {
  category?: string;
  make?: string;
  model?: string;
  year?: number | string;
  status?: string;
  featured?: boolean;
  search?: string;
  min_price?: number;
  max_price?: number;
  transmission_type?: string;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  stock_status?: string;
  ids?: string;
}

export async function getProducts(
  filters: ProductFilters = {},
  page = 1,
  limit = 20,
): Promise<{
  products: (typeof products.$inferSelect & { images: any[] })[];
  total: number;
  page: number;
  limit: number;
}> {
  const offset = (page - 1) * limit;
  const conditions = [eq(products.is_deleted, false)];

  if (filters.ids) {
    const idList = filters.ids.split(',').map((id) => id.trim()).filter(Boolean);
    if (idList.length > 0) {
      conditions.push(inArray(products.id, idList));
    }
  }

  // Storefront-wide "show out of stock" toggle. Admin can disable it from
  // the settings page; when off, hide products with quantity <= 0 (unless
  // the product has show_when_out_of_stock = true override).
  // Only apply when the caller did not explicitly request a status filter.
  const showOutOfStock = (await getSettingValue('show_out_of_stock', '0')) === '1';
  if (!showOutOfStock && (!filters.status || filters.status === 'active')) {
    conditions.push(
      or(
        sql`${products.quantity} > 0`,
        eq(products.show_when_out_of_stock, true),
      )!,
    );
  }

  if (filters.category) {
    const categories = filters.category.split(',').map((c) => c.trim()).filter(Boolean);
    if (categories.length === 1) {
      conditions.push(eq(products.category, categories[0] as 'engine' | 'transmission' | 'part'));
    } else if (categories.length > 1) {
      conditions.push(sql`${products.category} IN (${sql.join(categories.map((c) => sql`${c}`), sql`, `)})`);
    }
  }
  if (filters.make) {
    const makes = filters.make.split(',').map((m) => m.trim()).filter(Boolean);
    if (makes.length === 1) {
      conditions.push(eq(products.make, makes[0]));
    } else if (makes.length > 1) {
      conditions.push(sql`${products.make} IN (${sql.join(makes.map((m) => sql`${m}`), sql`, `)})`);
    }
  }
  if (filters.model) {
    const modelValues = filters.model.split(',').map((m) => m.trim()).filter(Boolean);
    if (modelValues.length === 1) {
      conditions.push(eq(products.model, modelValues[0]));
    } else if (modelValues.length > 1) {
      conditions.push(sql`${products.model} IN (${sql.join(modelValues.map((m) => sql`${m}`), sql`, `)})`);
    }
  }
  if (filters.status && filters.status !== 'all') {
    const statuses = filters.status.split(',').map((s) => {
      const trimmed = s.trim();
      return trimmed === 'draft' ? 'inactive' : trimmed;
    }).filter(Boolean);

    if (statuses.length === 1) {
      conditions.push(eq(products.status, statuses[0] as 'active' | 'inactive' | 'archived'));
    } else if (statuses.length > 1) {
      conditions.push(sql`${products.status} IN (${sql.join(statuses.map((s) => sql`${s}`), sql`, `)})`);
    }
  } else if (!filters.status) {
    conditions.push(eq(products.status, 'active'));
  }

  if (filters.stock_status) {
    const stockStatuses = filters.stock_status.split(',').map((s) => s.trim()).filter(Boolean);
    if (stockStatuses.length > 0) {
      const stockConditions = [];
      for (const status of stockStatuses) {
        if (status === 'inStock') {
          stockConditions.push(sql`${products.quantity} > 1`);
        } else if (status === 'lowStock') {
          stockConditions.push(sql`${products.quantity} = 1`);
        } else if (status === 'outOfStock') {
          stockConditions.push(sql`${products.quantity} = 0`);
        }
      }

      if (stockConditions.length === 1) {
        conditions.push(stockConditions[0]!);
      } else if (stockConditions.length > 1) {
        conditions.push(or(...stockConditions)!);
      }
    }
  }
  // If status === 'all', no status filter is applied
  if (filters.featured !== undefined) {
    conditions.push(eq(products.featured, filters.featured));
  }
  if (filters.min_price !== undefined) {
    conditions.push(sql`${products.price_cents} >= ${filters.min_price}`);
  }
  if (filters.max_price !== undefined) {
    conditions.push(sql`${products.price_cents} <= ${filters.max_price}`);
  }
  if (filters.transmission_type) {
    conditions.push(sql`LOWER(${products.transmission_type}) = LOWER(${filters.transmission_type})`);
  }
  if (filters.inStock === true) {
    conditions.push(sql`${products.quantity} > 0`);
  }
  if (filters.year !== undefined) {
    const yearStr = String(filters.year);
    const yearValues = yearStr.split(',').map((y) => parseInt(y.trim(), 10)).filter((y) => !isNaN(y));
    if (yearValues.length === 1) {
      const y = yearValues[0];
      conditions.push(
        and(
          or(isNull(products.year_start), sql`${products.year_start} <= ${y}`),
          or(isNull(products.year_end), sql`${products.year_end} >= ${y}`),
        )!,
      );
    } else if (yearValues.length > 1) {
      const yearConditions = yearValues.map((y) =>
        and(
          or(isNull(products.year_start), sql`${products.year_start} <= ${y}`),
          or(isNull(products.year_end), sql`${products.year_end} >= ${y}`),
        )!,
      );
      conditions.push(or(...yearConditions)!);
    }
  }

  if (filters.search) {
    const searchTokens = filters.search.split(/\s+/).filter(Boolean);
    for (const tok of searchTokens) {
      const term = `%${tok}%`;
      conditions.push(
        or(
          sql`${products.title} LIKE ${term}`,
          sql`${products.make} LIKE ${term}`,
          sql`${products.model} LIKE ${term}`,
          sql`${products.sku} LIKE ${term}`,
          sql`${products.engine_code} LIKE ${term}`,
          // year token (numeric) → match year_start <= y <= year_end
          /^\d{4}$/.test(tok)
            ? and(
                or(isNull(products.year_start), sql`${products.year_start} <= ${Number(tok)}`),
                or(isNull(products.year_end), sql`${products.year_end} >= ${Number(tok)}`),
              )!
            : sql`0`,
        )!,
      );
    }
  }

  const whereClause = and(...conditions);

  // Dynamic sort
  const sortColumnMap: Record<string, any> = {
    title: products.title,
    price: products.price_cents,
    stock: products.quantity,
    created_at: products.created_at,
    make: products.make,
    model: products.model,
    category: products.category,
    status: products.status,
    sku: products.sku,
  };
  let orderByClause = desc(products.created_at);
  if (filters.sortBy && sortColumnMap[filters.sortBy]) {
    const col = sortColumnMap[filters.sortBy];
    orderByClause = filters.sortOrder === 'asc' ? asc(col) : desc(col);
  }

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause),
  ]);

  const productsWithImages = await attachImages(rows);
  const mappedProducts = productsWithImages.map(mapProductStatus);

  return {
    products: mappedProducts,
    total: countRows[0]?.count ?? 0,
    page,
    limit,
  };
}

/** Batch-load images for a list of products and attach them to each row. */
async function attachImages<T extends { id: string }>(
  rows: T[],
): Promise<(T & { images: any[] })[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const allImages = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.product_id, ids))
    .orderBy(asc(productImages.sort_order));
  const byProduct = new Map<string, any[]>();
  for (const img of allImages) {
    const list = byProduct.get(img.product_id) ?? [];
    list.push(enrichImage(img));
    byProduct.set(img.product_id, list);
  }
  return rows.map((r) => ({ ...r, images: byProduct.get(r.id) ?? [] }));
}

export async function getProductBySlug(slug: string) {
  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_deleted, false)))
    .get();

  if (!product) return null;

  const [images, compatibility] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.product_id, product.id)),
    db
      .select()
      .from(productCompatibility)
      .where(eq(productCompatibility.product_id, product.id)),
  ]);

  return mapProductStatus({ ...product, images: images.map(enrichImage), compatibility });
}

export async function getProductById(id: string) {
  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.is_deleted, false)))
    .get();

  if (!product) return null;

  const [images, compatibility] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.product_id, product.id)),
    db
      .select()
      .from(productCompatibility)
      .where(eq(productCompatibility.product_id, product.id)),
  ]);

  return mapProductStatus({ ...product, images: images.map(enrichImage), compatibility });
}

type CreateProductData = Omit<NewProduct, 'slug'> & { slug?: string; compatibility?: Omit<NewProductCompatibility, 'id' | 'product_id'>[] };

export async function createProduct(data: CreateProductData) {
  const { compatibility, ...productData } = data;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const slug = productData.slug ?? generateSlug(productData.title);

  const newProduct = {
    ...productData,
    id,
    slug,
    created_at: now,
    updated_at: now,
  };

  await db.insert(products).values(newProduct);

  if (compatibility?.length) {
    await db.insert(productCompatibility).values(
      compatibility.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        product_id: id,
      })),
    );
  }

  // Index in FTS
  await searchService.indexProduct(id);

  // Sync to Google Merchant (non-blocking)
  getProductById(id).then((product) => {
    if (product && product.status === 'active') {
      syncProduct(product as any).catch((err) =>
        logger.error({ err, productId: id }, 'Failed to sync new product to Google Merchant'),
      );
    }
  }).catch(() => {});

  return getProductById(id);
}

export async function updateProduct(
  id: string,
  data: Partial<NewProduct> & { compatibility?: Omit<NewProductCompatibility, 'id' | 'product_id'>[] },
) {
  const { compatibility, ...updateData } = data as typeof data & { compatibility?: Omit<NewProductCompatibility, 'id' | 'product_id'>[] };

  const existing = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.is_deleted, false)))
    .get();

  if (!existing) throw createError('Product not found', 404);

  const updatedData = {
    ...updateData,
    updated_at: new Date().toISOString(),
  };

  await db.update(products).set(updatedData).where(eq(products.id, id));

  if (compatibility !== undefined) {
    await db.delete(productCompatibility).where(eq(productCompatibility.product_id, id));
    if (compatibility.length > 0) {
      await db.insert(productCompatibility).values(
        compatibility.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          product_id: id,
        })),
      );
    }
  }

  // Re-index in FTS
  await searchService.indexProduct(id);

  // Sync to Google Merchant (non-blocking)
  getProductById(id).then((product) => {
    if (product) {
      if (product.status === 'active' && !product.is_deleted) {
        syncProduct(product as any).catch((err) =>
          logger.error({ err, productId: id }, 'Failed to sync updated product to Google Merchant'),
        );
      } else {
        deleteProductFromMerchant(product.id).catch((err) =>
          logger.error({ err, productId: id }, 'Failed to delete updated product from Google Merchant'),
        );
      }
    }
  }).catch(() => {});

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, id), eq(products.is_deleted, false)))
    .get();

  if (!existing) throw createError('Product not found', 404);

  await db
    .update(products)
    .set({ is_deleted: true, updated_at: new Date().toISOString() })
    .where(eq(products.id, id));

  // Delete from Google Merchant (non-blocking)
  deleteProductFromMerchant(id).catch((err) =>
    logger.error({ err, productId: id }, 'Failed to delete removed product from Google Merchant'),
  );
}

export async function getMakes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ make: products.make })
    .from(products)
    .where(and(eq(products.is_deleted, false), eq(products.status, 'active'), sql`${products.make} IS NOT NULL`))
    .orderBy(asc(products.make));

  return rows.map((r) => r.make).filter((m): m is string => m !== null);
}

export async function getModelsByMake(make: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ model: products.model })
    .from(products)
    .where(
      and(
        eq(products.is_deleted, false),
        eq(products.status, 'active'),
        eq(products.make, make),
        sql`${products.model} IS NOT NULL`,
      ),
    )
    .orderBy(asc(products.model));

  return rows.map((r) => r.model).filter((m): m is string => m !== null);
}

export async function getYearsByMakeModel(make: string, model: string): Promise<number[]> {
  const rows = await db
    .select({
      year_start: products.year_start,
      year_end: products.year_end,
    })
    .from(products)
    .where(
      and(
        eq(products.is_deleted, false),
        eq(products.status, 'active'),
        eq(products.make, make),
        eq(products.model, model),
      ),
    );

  const yearsSet = new Set<number>();
  for (const row of rows) {
    if (row.year_start && row.year_end) {
      for (let y = row.year_start; y <= row.year_end; y++) {
        yearsSet.add(y);
      }
    } else if (row.year_start) {
      yearsSet.add(row.year_start);
    } else if (row.year_end) {
      yearsSet.add(row.year_end);
    }
  }

  return Array.from(yearsSet).sort((a, b) => a - b);
}

export async function getFeaturedProducts() {
  const rows = await db
    .select()
    .from(products)
    .where(
      and(eq(products.is_deleted, false), eq(products.status, 'active'), eq(products.featured, true)),
    )
    .orderBy(desc(products.created_at))
    .limit(12);

  return attachImages(rows);
}
