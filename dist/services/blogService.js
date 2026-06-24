"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedPosts = getPublishedPosts;
exports.getPostBySlug = getPostBySlug;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.getAllPosts = getAllPosts;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const slug_1 = require("../utils/slug");
const errorHandler_1 = require("../middleware/errorHandler");
async function getPublishedPosts(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.blogPosts)
            .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.status, 'published'))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.blogPosts.published_at))
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.blogPosts)
            .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.status, 'published')),
    ]);
    return { posts: rows, total: countRows[0]?.count ?? 0, page, limit };
}
async function getPostBySlug(slug) {
    return database_1.db
        .select()
        .from(schema_1.blogPosts)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.blogPosts.slug, slug), (0, drizzle_orm_1.eq)(schema_1.blogPosts.status, 'published')))
        .get();
}
async function getPostById(id) {
    return database_1.db
        .select()
        .from(schema_1.blogPosts)
        .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id))
        .get();
}
async function createPost(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = data.slug ?? (0, slug_1.generateSlug)(data.title);
    const newPost = {
        ...data,
        id,
        slug,
        created_at: now,
        updated_at: now,
        published_at: data.status === 'published' && !data.published_at ? now : data.published_at,
    };
    await database_1.db.insert(schema_1.blogPosts).values(newPost);
    return database_1.db.select().from(schema_1.blogPosts).where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id)).get();
}
async function updatePost(id, data) {
    const existing = await database_1.db
        .select({ id: schema_1.blogPosts.id, status: schema_1.blogPosts.status })
        .from(schema_1.blogPosts)
        .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Blog post not found', 404);
    const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
        // Set published_at when first publishing
        ...(data.status === 'published' && existing.status === 'draft' && !data.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
    };
    await database_1.db.update(schema_1.blogPosts).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id));
    return database_1.db.select().from(schema_1.blogPosts).where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id)).get();
}
async function deletePost(id) {
    const existing = await database_1.db
        .select({ id: schema_1.blogPosts.id })
        .from(schema_1.blogPosts)
        .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Blog post not found', 404);
    await database_1.db.delete(schema_1.blogPosts).where((0, drizzle_orm_1.eq)(schema_1.blogPosts.id, id));
}
async function getAllPosts(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.blogPosts)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.blogPosts.created_at))
            .limit(limit)
            .offset(offset),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.blogPosts),
    ]);
    return { posts: rows, total: countRows[0]?.count ?? 0, page, limit };
}
//# sourceMappingURL=blogService.js.map