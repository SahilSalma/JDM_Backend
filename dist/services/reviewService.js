"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEligibility = checkEligibility;
exports.createReview = createReview;
exports.getProductReviews = getProductReviews;
exports.getHomepageReviews = getHomepageReviews;
exports.getAdminReviews = getAdminReviews;
exports.getReviewById = getReviewById;
exports.deleteReview = deleteReview;
exports.updateReview = updateReview;
exports.setFeaturedReviews = setFeaturedReviews;
exports.recalculateFeatured = recalculateFeatured;
exports.getOrdersForEmail = getOrdersForEmail;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const errorHandler_1 = require("../middleware/errorHandler");
const settingsService_1 = require("./settingsService");
async function checkEligibility(email, productId) {
    const customerOrders = await database_1.db
        .select({ id: schema_1.orders.id, order_number: schema_1.orders.order_number, created_at: schema_1.orders.created_at })
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.customer_email, email))
        .all();
    if (customerOrders.length === 0) {
        return [];
    }
    const orderIds = customerOrders.map((o) => o.id);
    const orderMap = new Map(customerOrders.map((o) => [o.id, o]));
    const items = await database_1.db
        .select({
        product_id: schema_1.orderItems.product_id,
        product_title: schema_1.orderItems.product_title,
        product_sku: schema_1.orderItems.product_sku,
        order_id: schema_1.orderItems.order_id,
    })
        .from(schema_1.orderItems)
        .where((0, drizzle_orm_1.inArray)(schema_1.orderItems.order_id, orderIds))
        .all();
    const existingReviews = await database_1.db
        .select({ product_id: schema_1.reviews.product_id, order_id: schema_1.reviews.order_id })
        .from(schema_1.reviews)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reviews.customer_email, email), (0, drizzle_orm_1.inArray)(schema_1.reviews.order_id, orderIds)))
        .all();
    const alreadyReviewed = new Set(existingReviews.map((r) => `${r.product_id}:${r.order_id}`));
    const eligible = items
        .filter((item) => {
        if (item.product_id === null)
            return false;
        const key = `${item.product_id}:${item.order_id}`;
        return !alreadyReviewed.has(key);
    })
        .map((item) => {
        const order = orderMap.get(item.order_id);
        return {
            product_id: item.product_id,
            product_title: item.product_title,
            product_sku: item.product_sku,
            order_id: item.order_id,
            order_number: order.order_number,
            created_at: order.created_at,
        };
    });
    if (productId) {
        const match = eligible.filter((e) => e.product_id === productId);
        return match.length > 0 ? match : eligible;
    }
    return eligible;
}
async function createReview(data) {
    const order = await database_1.db
        .select()
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, data.order_id))
        .get();
    if (!order) {
        throw (0, errorHandler_1.createError)('Order not found', 404);
    }
    if (order.customer_email !== data.customer_email) {
        throw (0, errorHandler_1.createError)('Email does not match order', 403);
    }
    const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
    const now = new Date().toISOString();
    const newReview = {
        id: crypto.randomUUID(),
        product_id: data.product_id,
        order_id: data.order_id,
        customer_name: customerName,
        customer_email: data.customer_email,
        rating: data.rating,
        title: data.title || null,
        content: data.content,
        images: data.images ? JSON.stringify(data.images) : '[]',
        status: 'approved',
        is_featured: false,
        sort_order: 0,
        created_at: now,
        updated_at: now,
    };
    await database_1.db.insert(schema_1.reviews).values(newReview);
    const mode = await (0, settingsService_1.getSettingValue)('reviews_mode', 'automatic');
    if (mode === 'automatic') {
        await recalculateFeatured();
    }
    const created = await database_1.db
        .select()
        .from(schema_1.reviews)
        .where((0, drizzle_orm_1.eq)(schema_1.reviews.id, newReview.id))
        .get();
    return created;
}
async function getProductReviews(productId, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const sortMap = {
        date: schema_1.reviews.created_at,
        rating: schema_1.reviews.rating,
        name: schema_1.reviews.customer_name,
    };
    let orderByClause = (0, drizzle_orm_1.desc)(schema_1.reviews.created_at);
    if (sortMap[sortBy]) {
        const col = sortMap[sortBy];
        orderByClause = sortOrder === 'asc' ? (0, drizzle_orm_1.asc)(col) : (0, drizzle_orm_1.desc)(col);
    }
    const whereClause = (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reviews.product_id, productId), (0, drizzle_orm_1.eq)(schema_1.reviews.status, 'approved'));
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.reviews)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.reviews)
            .where(whereClause),
    ]);
    const parsed = rows.map((r) => ({
        ...r,
        images: parseImages(r.images),
    }));
    return {
        reviews: parsed,
        total: countRows[0]?.count ?? 0,
        page,
        limit,
    };
}
async function getHomepageReviews() {
    const mode = await (0, settingsService_1.getSettingValue)('reviews_mode', 'automatic');
    if (mode === 'manual') {
        const rows = await database_1.db
            .select()
            .from(schema_1.reviews)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.reviews.is_featured, true), (0, drizzle_orm_1.eq)(schema_1.reviews.status, 'approved')))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.reviews.sort_order))
            .limit(5)
            .all();
        const enriched = await Promise.all(rows.map(enrichReviewWithProduct));
        return enriched;
    }
    const rows = await database_1.db
        .select()
        .from(schema_1.reviews)
        .where((0, drizzle_orm_1.eq)(schema_1.reviews.status, 'approved'))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.reviews.rating), (0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `length(${schema_1.reviews.content})`), (0, drizzle_orm_1.desc)(schema_1.reviews.created_at))
        .limit(5)
        .all();
    const enriched = await Promise.all(rows.map(enrichReviewWithProduct));
    return enriched;
}
async function enrichReviewWithProduct(review) {
    const product = await database_1.db
        .select({ id: schema_1.products.id, title: schema_1.products.title, slug: schema_1.products.slug, primary_image_path: schema_1.products.primary_image_path })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, review.product_id))
        .get();
    return {
        ...review,
        images: parseImages(review.images),
        product: product || null,
    };
}
function parseImages(images) {
    if (!images)
        return [];
    try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
async function getAdminReviews(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters.status) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.reviews.status, filters.status));
    }
    if (filters.order_id) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.reviews.order_id, filters.order_id));
    }
    if (filters.product_id) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.reviews.product_id, filters.product_id));
    }
    if (filters.rating_min) {
        conditions.push((0, drizzle_orm_1.gte)(schema_1.reviews.rating, filters.rating_min));
    }
    if (filters.rating_max) {
        conditions.push((0, drizzle_orm_1.lte)(schema_1.reviews.rating, filters.rating_max));
    }
    if (filters.search) {
        const term = `%${filters.search}%`;
        conditions.push((0, drizzle_orm_1.sql) `(${(0, drizzle_orm_1.like)(schema_1.reviews.customer_name, term)} OR ${(0, drizzle_orm_1.like)(schema_1.reviews.customer_email, term)} OR ${(0, drizzle_orm_1.like)(schema_1.reviews.content, term)})`);
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const sortMap = {
        created_at: schema_1.reviews.created_at,
        rating: schema_1.reviews.rating,
        customer_name: schema_1.reviews.customer_name,
    };
    let orderByClause = (0, drizzle_orm_1.desc)(schema_1.reviews.created_at);
    if (filters.sortBy && sortMap[filters.sortBy]) {
        const col = sortMap[filters.sortBy];
        orderByClause = filters.sortOrder === 'asc' ? (0, drizzle_orm_1.asc)(col) : (0, drizzle_orm_1.desc)(col);
    }
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.reviews)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.reviews)
            .where(whereClause),
    ]);
    const enriched = await Promise.all(rows.map(async (r) => {
        const product = await database_1.db
            .select({ id: schema_1.products.id, title: schema_1.products.title, slug: schema_1.products.slug })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, r.product_id))
            .get();
        const order = await database_1.db
            .select({ id: schema_1.orders.id, order_number: schema_1.orders.order_number })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, r.order_id))
            .get();
        return {
            ...r,
            images: parseImages(r.images),
            product: product || null,
            order: order || null,
        };
    }));
    return {
        reviews: enriched,
        total: countRows[0]?.count ?? 0,
        page,
        limit,
    };
}
async function getReviewById(id) {
    const row = await database_1.db.select().from(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id)).get();
    if (!row)
        return null;
    const product = await database_1.db
        .select({ id: schema_1.products.id, title: schema_1.products.title, slug: schema_1.products.slug })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, row.product_id))
        .get();
    const order = await database_1.db
        .select({ id: schema_1.orders.id, order_number: schema_1.orders.order_number })
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, row.order_id))
        .get();
    return {
        ...row,
        images: parseImages(row.images),
        product: product || null,
        order: order || null,
    };
}
async function deleteReview(id) {
    const existing = await database_1.db.select({ id: schema_1.reviews.id }).from(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id)).get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Review not found', 404);
    await database_1.db.delete(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id));
    const mode = await (0, settingsService_1.getSettingValue)('reviews_mode', 'automatic');
    if (mode === 'automatic') {
        await recalculateFeatured();
    }
}
async function updateReview(id, data) {
    const existing = await database_1.db.select().from(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id)).get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Review not found', 404);
    const updateData = {
        updated_at: new Date().toISOString(),
    };
    if (data.status !== undefined) {
        updateData.status = data.status;
    }
    if (data.is_featured !== undefined) {
        updateData.is_featured = data.is_featured;
    }
    await database_1.db.update(schema_1.reviews).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id));
    const updated = await database_1.db.select().from(schema_1.reviews).where((0, drizzle_orm_1.eq)(schema_1.reviews.id, id)).get();
    return updated;
}
async function setFeaturedReviews(ids) {
    await database_1.db
        .update(schema_1.reviews)
        .set({ is_featured: false, sort_order: 0, updated_at: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.reviews.is_featured, true));
    for (let i = 0; i < ids.length; i++) {
        await database_1.db
            .update(schema_1.reviews)
            .set({ is_featured: true, sort_order: i, updated_at: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.reviews.id, ids[i]));
    }
}
async function recalculateFeatured() {
    const top5 = await database_1.db
        .select()
        .from(schema_1.reviews)
        .where((0, drizzle_orm_1.eq)(schema_1.reviews.status, 'approved'))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.reviews.rating), (0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `length(${schema_1.reviews.content})`), (0, drizzle_orm_1.desc)(schema_1.reviews.created_at))
        .limit(5)
        .all();
    await database_1.db
        .update(schema_1.reviews)
        .set({ is_featured: false, sort_order: 0, updated_at: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.reviews.is_featured, true));
    for (let i = 0; i < top5.length; i++) {
        await database_1.db
            .update(schema_1.reviews)
            .set({ is_featured: true, sort_order: i, updated_at: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.reviews.id, top5[i].id));
    }
}
async function getOrdersForEmail(email) {
    return database_1.db
        .select({
        id: schema_1.orders.id,
        order_number: schema_1.orders.order_number,
        created_at: schema_1.orders.created_at,
        total_cents: schema_1.orders.total_cents,
    })
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.customer_email, email))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.created_at))
        .all();
}
//# sourceMappingURL=reviewService.js.map