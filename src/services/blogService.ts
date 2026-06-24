import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { blogPosts } from '../models/schema';
import type { NewBlogPost } from '../models/schema';
import { generateSlug } from '../utils/slug';
import { createError } from '../middleware/errorHandler';

export async function getPublishedPosts(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.published_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published')),
  ]);

  return { posts: rows, total: countRows[0]?.count ?? 0, page, limit };
}

export async function getPostBySlug(slug: string) {
  return db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .get();
}

export async function getPostById(id: string) {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .get();
}

export async function createPost(data: Omit<NewBlogPost, 'id' | 'created_at' | 'updated_at'> & { slug?: string }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const slug = data.slug ?? generateSlug(data.title);

  const newPost: NewBlogPost = {
    ...data,
    id,
    slug,
    created_at: now,
    updated_at: now,
    published_at: data.status === 'published' && !data.published_at ? now : data.published_at,
  };

  await db.insert(blogPosts).values(newPost);
  return db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
}

export async function updatePost(
  id: string,
  data: Partial<Omit<NewBlogPost, 'id' | 'created_at'>>,
) {
  const existing = await db
    .select({ id: blogPosts.id, status: blogPosts.status })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .get();

  if (!existing) throw createError('Blog post not found', 404);

  const updateData = {
    ...data,
    updated_at: new Date().toISOString(),
    // Set published_at when first publishing
    ...(data.status === 'published' && existing.status === 'draft' && !data.published_at
      ? { published_at: new Date().toISOString() }
      : {}),
  };

  await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
  return db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
}

export async function deletePost(id: string): Promise<void> {
  const existing = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .get();

  if (!existing) throw createError('Blog post not found', 404);

  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function getAllPosts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.created_at))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(blogPosts),
  ]);

  return { posts: rows, total: countRows[0]?.count ?? 0, page, limit };
}
