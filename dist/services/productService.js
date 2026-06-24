"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProductBySlug = getProductBySlug;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getMakes = getMakes;
exports.getModelsByMake = getModelsByMake;
exports.getYearsByMakeModel = getYearsByMakeModel;
exports.getFeaturedProducts = getFeaturedProducts;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const slug_1 = require("../utils/slug");
const errorHandler_1 = require("../middleware/errorHandler");
const searchService_1 = require("./searchService");
const settingsService_1 = require("./settingsService");
const merchantService_1 = require("./merchantService");
const logger_1 = require("../middleware/logger");
const imageService_1 = require("./imageService");
function mapProductStatus(product) {
    return {
        ...product,
        status: (product.status === 'inactive' ? 'draft' : product.status),
    };
}
async function getProducts(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions = [(0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)];
    if (filters.ids) {
        const idList = filters.ids.split(',').map((id) => id.trim()).filter(Boolean);
        if (idList.length > 0) {
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.products.id, idList));
        }
    }
    // Storefront-wide "show out of stock" toggle. Admin can disable it from
    // the settings page; when off, hide products with quantity <= 0 (unless
    // the product has show_when_out_of_stock = true override).
    // Only apply when the caller did not explicitly request a status filter.
    const showOutOfStock = (await (0, settingsService_1.getSettingValue)('show_out_of_stock', '0')) === '1';
    if (!showOutOfStock && (!filters.status || filters.status === 'active')) {
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.sql) `${schema_1.products.quantity} > 0`, (0, drizzle_orm_1.eq)(schema_1.products.show_when_out_of_stock, true)));
    }
    if (filters.category) {
        const categories = filters.category.split(',').map((c) => c.trim()).filter(Boolean);
        if (categories.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.products.category, categories[0]));
        }
        else if (categories.length > 1) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.category} IN (${drizzle_orm_1.sql.join(categories.map((c) => (0, drizzle_orm_1.sql) `${c}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
    }
    if (filters.make) {
        const makes = filters.make.split(',').map((m) => m.trim()).filter(Boolean);
        if (makes.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.products.make, makes[0]));
        }
        else if (makes.length > 1) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.make} IN (${drizzle_orm_1.sql.join(makes.map((m) => (0, drizzle_orm_1.sql) `${m}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
    }
    if (filters.model) {
        const modelValues = filters.model.split(',').map((m) => m.trim()).filter(Boolean);
        if (modelValues.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.products.model, modelValues[0]));
        }
        else if (modelValues.length > 1) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.model} IN (${drizzle_orm_1.sql.join(modelValues.map((m) => (0, drizzle_orm_1.sql) `${m}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
    }
    if (filters.status && filters.status !== 'all') {
        const statuses = filters.status.split(',').map((s) => {
            const trimmed = s.trim();
            return trimmed === 'draft' ? 'inactive' : trimmed;
        }).filter(Boolean);
        if (statuses.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.products.status, statuses[0]));
        }
        else if (statuses.length > 1) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.status} IN (${drizzle_orm_1.sql.join(statuses.map((s) => (0, drizzle_orm_1.sql) `${s}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
    }
    else if (!filters.status) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.products.status, 'active'));
    }
    if (filters.stock_status) {
        const stockStatuses = filters.stock_status.split(',').map((s) => s.trim()).filter(Boolean);
        if (stockStatuses.length > 0) {
            const stockConditions = [];
            for (const status of stockStatuses) {
                if (status === 'inStock') {
                    stockConditions.push((0, drizzle_orm_1.sql) `${schema_1.products.quantity} > 1`);
                }
                else if (status === 'lowStock') {
                    stockConditions.push((0, drizzle_orm_1.sql) `${schema_1.products.quantity} = 1`);
                }
                else if (status === 'outOfStock') {
                    stockConditions.push((0, drizzle_orm_1.sql) `${schema_1.products.quantity} = 0`);
                }
            }
            if (stockConditions.length === 1) {
                conditions.push(stockConditions[0]);
            }
            else if (stockConditions.length > 1) {
                conditions.push((0, drizzle_orm_1.or)(...stockConditions));
            }
        }
    }
    // If status === 'all', no status filter is applied
    if (filters.featured !== undefined) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.products.featured, filters.featured));
    }
    if (filters.min_price !== undefined) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.price_cents} >= ${filters.min_price}`);
    }
    if (filters.max_price !== undefined) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.price_cents} <= ${filters.max_price}`);
    }
    if (filters.transmission_type) {
        conditions.push((0, drizzle_orm_1.sql) `LOWER(${schema_1.products.transmission_type}) = LOWER(${filters.transmission_type})`);
    }
    if (filters.inStock === true) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.products.quantity} > 0`);
    }
    if (filters.year !== undefined) {
        const yearStr = String(filters.year);
        const yearValues = yearStr.split(',').map((y) => parseInt(y.trim(), 10)).filter((y) => !isNaN(y));
        if (yearValues.length === 1) {
            const y = yearValues[0];
            conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_start), (0, drizzle_orm_1.sql) `${schema_1.products.year_start} <= ${y}`), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_end), (0, drizzle_orm_1.sql) `${schema_1.products.year_end} >= ${y}`)));
        }
        else if (yearValues.length > 1) {
            const yearConditions = yearValues.map((y) => (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_start), (0, drizzle_orm_1.sql) `${schema_1.products.year_start} <= ${y}`), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_end), (0, drizzle_orm_1.sql) `${schema_1.products.year_end} >= ${y}`)));
            conditions.push((0, drizzle_orm_1.or)(...yearConditions));
        }
    }
    if (filters.search) {
        const searchTokens = filters.search.split(/\s+/).filter(Boolean);
        for (const tok of searchTokens) {
            const term = `%${tok}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.sql) `${schema_1.products.title} LIKE ${term}`, (0, drizzle_orm_1.sql) `${schema_1.products.make} LIKE ${term}`, (0, drizzle_orm_1.sql) `${schema_1.products.model} LIKE ${term}`, (0, drizzle_orm_1.sql) `${schema_1.products.sku} LIKE ${term}`, (0, drizzle_orm_1.sql) `${schema_1.products.engine_code} LIKE ${term}`, 
            // year token (numeric) → match year_start <= y <= year_end
            /^\d{4}$/.test(tok)
                ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_start), (0, drizzle_orm_1.sql) `${schema_1.products.year_start} <= ${Number(tok)}`), (0, drizzle_orm_1.or)((0, drizzle_orm_1.isNull)(schema_1.products.year_end), (0, drizzle_orm_1.sql) `${schema_1.products.year_end} >= ${Number(tok)}`))
                : (0, drizzle_orm_1.sql) `0`));
        }
    }
    const whereClause = (0, drizzle_orm_1.and)(...conditions);
    // Dynamic sort
    const sortColumnMap = {
        title: schema_1.products.title,
        price: schema_1.products.price_cents,
        stock: schema_1.products.quantity,
        created_at: schema_1.products.created_at,
        make: schema_1.products.make,
        model: schema_1.products.model,
        category: schema_1.products.category,
        status: schema_1.products.status,
        sku: schema_1.products.sku,
    };
    let orderByClause = (0, drizzle_orm_1.desc)(schema_1.products.created_at);
    if (filters.sortBy && sortColumnMap[filters.sortBy]) {
        const col = sortColumnMap[filters.sortBy];
        orderByClause = filters.sortOrder === 'asc' ? (0, drizzle_orm_1.asc)(col) : (0, drizzle_orm_1.desc)(col);
    }
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.products)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.products)
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
async function attachImages(rows) {
    if (rows.length === 0)
        return [];
    const ids = rows.map((r) => r.id);
    const allImages = await database_1.db
        .select()
        .from(schema_1.productImages)
        .where((0, drizzle_orm_1.inArray)(schema_1.productImages.product_id, ids))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.productImages.sort_order));
    const byProduct = new Map();
    for (const img of allImages) {
        const list = byProduct.get(img.product_id) ?? [];
        list.push((0, imageService_1.enrichImage)(img));
        byProduct.set(img.product_id, list);
    }
    return rows.map((r) => ({ ...r, images: byProduct.get(r.id) ?? [] }));
}
async function getProductBySlug(slug) {
    const product = await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.slug, slug), (0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)))
        .get();
    if (!product)
        return null;
    const [images, compatibility] = await Promise.all([
        database_1.db.select().from(schema_1.productImages).where((0, drizzle_orm_1.eq)(schema_1.productImages.product_id, product.id)),
        database_1.db
            .select()
            .from(schema_1.productCompatibility)
            .where((0, drizzle_orm_1.eq)(schema_1.productCompatibility.product_id, product.id)),
    ]);
    return mapProductStatus({ ...product, images: images.map(imageService_1.enrichImage), compatibility });
}
async function getProductById(id) {
    const product = await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, id), (0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)))
        .get();
    if (!product)
        return null;
    const [images, compatibility] = await Promise.all([
        database_1.db.select().from(schema_1.productImages).where((0, drizzle_orm_1.eq)(schema_1.productImages.product_id, product.id)),
        database_1.db
            .select()
            .from(schema_1.productCompatibility)
            .where((0, drizzle_orm_1.eq)(schema_1.productCompatibility.product_id, product.id)),
    ]);
    return mapProductStatus({ ...product, images: images.map(imageService_1.enrichImage), compatibility });
}
async function createProduct(data) {
    const { compatibility, ...productData } = data;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = productData.slug ?? (0, slug_1.generateSlug)(productData.title);
    const newProduct = {
        ...productData,
        id,
        slug,
        created_at: now,
        updated_at: now,
    };
    await database_1.db.insert(schema_1.products).values(newProduct);
    if (compatibility?.length) {
        await database_1.db.insert(schema_1.productCompatibility).values(compatibility.map((c) => ({
            ...c,
            id: crypto.randomUUID(),
            product_id: id,
        })));
    }
    // Index in FTS
    await searchService_1.searchService.indexProduct(id);
    // Sync to Google Merchant (non-blocking)
    getProductById(id).then((product) => {
        if (product && product.status === 'active') {
            (0, merchantService_1.syncProduct)(product).catch((err) => logger_1.logger.error({ err, productId: id }, 'Failed to sync new product to Google Merchant'));
        }
    }).catch(() => { });
    return getProductById(id);
}
async function updateProduct(id, data) {
    const { compatibility, ...updateData } = data;
    const existing = await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, id), (0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Product not found', 404);
    const updatedData = {
        ...updateData,
        updated_at: new Date().toISOString(),
    };
    await database_1.db.update(schema_1.products).set(updatedData).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    if (compatibility !== undefined) {
        await database_1.db.delete(schema_1.productCompatibility).where((0, drizzle_orm_1.eq)(schema_1.productCompatibility.product_id, id));
        if (compatibility.length > 0) {
            await database_1.db.insert(schema_1.productCompatibility).values(compatibility.map((c) => ({
                ...c,
                id: crypto.randomUUID(),
                product_id: id,
            })));
        }
    }
    // Re-index in FTS
    await searchService_1.searchService.indexProduct(id);
    // Sync to Google Merchant (non-blocking)
    getProductById(id).then((product) => {
        if (product) {
            if (product.status === 'active' && !product.is_deleted) {
                (0, merchantService_1.syncProduct)(product).catch((err) => logger_1.logger.error({ err, productId: id }, 'Failed to sync updated product to Google Merchant'));
            }
            else {
                (0, merchantService_1.deleteProductFromMerchant)(product.id).catch((err) => logger_1.logger.error({ err, productId: id }, 'Failed to delete updated product from Google Merchant'));
            }
        }
    }).catch(() => { });
    return getProductById(id);
}
async function deleteProduct(id) {
    const existing = await database_1.db
        .select({ id: schema_1.products.id })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, id), (0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Product not found', 404);
    await database_1.db
        .update(schema_1.products)
        .set({ is_deleted: true, updated_at: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
    // Delete from Google Merchant (non-blocking)
    (0, merchantService_1.deleteProductFromMerchant)(id).catch((err) => logger_1.logger.error({ err, productId: id }, 'Failed to delete removed product from Google Merchant'));
}
async function getMakes() {
    const rows = await database_1.db
        .selectDistinct({ make: schema_1.products.make })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'), (0, drizzle_orm_1.sql) `${schema_1.products.make} IS NOT NULL`))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.products.make));
    return rows.map((r) => r.make).filter((m) => m !== null);
}
async function getModelsByMake(make) {
    const rows = await database_1.db
        .selectDistinct({ model: schema_1.products.model })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'), (0, drizzle_orm_1.eq)(schema_1.products.make, make), (0, drizzle_orm_1.sql) `${schema_1.products.model} IS NOT NULL`))
        .orderBy((0, drizzle_orm_1.asc)(schema_1.products.model));
    return rows.map((r) => r.model).filter((m) => m !== null);
}
async function getYearsByMakeModel(make, model) {
    const rows = await database_1.db
        .select({
        year_start: schema_1.products.year_start,
        year_end: schema_1.products.year_end,
    })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'), (0, drizzle_orm_1.eq)(schema_1.products.make, make), (0, drizzle_orm_1.eq)(schema_1.products.model, model)));
    const yearsSet = new Set();
    for (const row of rows) {
        if (row.year_start && row.year_end) {
            for (let y = row.year_start; y <= row.year_end; y++) {
                yearsSet.add(y);
            }
        }
        else if (row.year_start) {
            yearsSet.add(row.year_start);
        }
        else if (row.year_end) {
            yearsSet.add(row.year_end);
        }
    }
    return Array.from(yearsSet).sort((a, b) => a - b);
}
async function getFeaturedProducts() {
    const rows = await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'), (0, drizzle_orm_1.eq)(schema_1.products.featured, true)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.products.created_at))
        .limit(12);
    return attachImages(rows);
}
//# sourceMappingURL=productService.js.map