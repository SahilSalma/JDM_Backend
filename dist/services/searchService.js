"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = void 0;
const database_1 = require("../config/database");
const database_2 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../middleware/logger");
async function indexProduct(productId) {
    const product = await database_2.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId))
        .get();
    if (!product)
        return;
    try {
        // Delete existing FTS record
        database_1.sqlite.prepare('DELETE FROM products_fts WHERE product_id = ?').run(productId);
        // Build a years string covering year_start–year_end so users can search by year.
        let years = '';
        if (product.year_start && product.year_end) {
            const start = product.year_start;
            const end = Math.min(product.year_end, start + 30); // cap range to avoid huge tokens
            const list = [];
            for (let y = start; y <= end; y++)
                list.push(String(y));
            years = list.join(' ');
        }
        else if (product.year_start) {
            years = String(product.year_start);
        }
        // Insert/re-index the product
        database_1.sqlite
            .prepare(`INSERT INTO products_fts (product_id, title, description, sku, make, model, engine_code)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(product.id, `${product.title ?? ''} ${years}`.trim(), product.description ?? '', product.sku ?? '', product.make ?? '', product.model ?? '', product.engine_code ?? '');
    }
    catch (err) {
        logger_1.logger.warn({ err, productId }, 'Failed to index product in FTS');
    }
}
/** Ensure every active product is indexed. Called lazily on first search. */
let bulkIndexed = false;
async function ensureBulkIndexed() {
    if (bulkIndexed)
        return;
    try {
        const allProducts = await database_2.db
            .select({ id: schema_1.products.id })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active')));
        for (const p of allProducts) {
            await indexProduct(p.id);
        }
        bulkIndexed = true;
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Bulk FTS indexing failed');
    }
}
async function searchProducts(query, limit = 20) {
    if (!query.trim())
        return [];
    await ensureBulkIndexed();
    try {
        // Sanitize query for FTS5 — wrap in quotes if it contains special chars, then add wildcard
        const sanitizedQuery = query.replace(/['"*]/g, '').trim();
        if (!sanitizedQuery)
            return [];
        // Tokenize so multi-word queries (e.g. "honda 2010 k24") match all tokens.
        const tokens = sanitizedQuery.split(/\s+/).filter(Boolean);
        const ftsQuery = tokens.map((t) => `${t}*`).join(' ');
        const ftsResults = database_1.sqlite
            .prepare(`SELECT product_id, rank
         FROM products_fts
         WHERE products_fts MATCH ?
         ORDER BY rank
         LIMIT ?`)
            .all(ftsQuery, limit);
        if (!ftsResults.length)
            return [];
        const productIds = ftsResults.map((r) => r.product_id);
        const rankMap = new Map(ftsResults.map((r) => [r.product_id, r.rank]));
        const productRows = await database_2.db
            .select({
            id: schema_1.products.id,
            sku: schema_1.products.sku,
            slug: schema_1.products.slug,
            title: schema_1.products.title,
            price_cents: schema_1.products.price_cents,
            primary_image_path: schema_1.products.primary_image_path,
            make: schema_1.products.make,
            model: schema_1.products.model,
            category: schema_1.products.category,
        })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active')));
        const filtered = productRows
            .filter((p) => productIds.includes(p.id))
            .map((p) => ({ ...p, rank: rankMap.get(p.id) }))
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        return filtered;
    }
    catch (err) {
        logger_1.logger.warn({ err, query }, 'FTS search error');
        return [];
    }
}
exports.searchService = {
    indexProduct,
    searchProducts,
};
//# sourceMappingURL=searchService.js.map