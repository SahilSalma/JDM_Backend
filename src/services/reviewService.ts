import { eq, and, desc, asc, like, sql, inArray, lte, gte } from 'drizzle-orm';
import { db } from '../config/database';
import { reviews, orders, orderItems, products } from '../models/schema';
import type { NewReview, Review } from '../models/schema';
import { createError } from '../middleware/errorHandler';
import { getSettingValue } from './settingsService';

export interface ReviewFilters {
  status?: string;
  product_id?: string;
  rating_min?: number;
  rating_max?: number;
  search?: string;
  order_id?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateReviewData {
  product_id: string;
  order_id: string;
  customer_email: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
}

export async function checkEligibility(
  email: string,
  productId?: string,
): Promise<Array<{ product_id: string; product_title: string; product_sku: string; order_id: string; order_number: string; created_at: string }>> {
  const customerOrders = await db
    .select({ id: orders.id, order_number: orders.order_number, created_at: orders.created_at })
    .from(orders)
    .where(eq(orders.customer_email, email))
    .all();

  if (customerOrders.length === 0) {
    return [];
  }

  const orderIds = customerOrders.map((o) => o.id);
  const orderMap = new Map(customerOrders.map((o) => [o.id, o]));

  const items = await db
    .select({
      product_id: orderItems.product_id,
      product_title: orderItems.product_title,
      product_sku: orderItems.product_sku,
      order_id: orderItems.order_id,
    })
    .from(orderItems)
    .where(inArray(orderItems.order_id, orderIds))
    .all();

  const existingReviews = await db
    .select({ product_id: reviews.product_id, order_id: reviews.order_id })
    .from(reviews)
    .where(and(eq(reviews.customer_email, email), inArray(reviews.order_id, orderIds)))
    .all();

  const alreadyReviewed = new Set(existingReviews.map((r) => `${r.product_id}:${r.order_id}`));

  const eligible = items
    .filter((item) => {
      if (item.product_id === null) return false;
      const key = `${item.product_id}:${item.order_id}`;
      return !alreadyReviewed.has(key);
    })
    .map((item) => {
      const order = orderMap.get(item.order_id)!;
      return {
        product_id: item.product_id!,
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

export async function createReview(data: CreateReviewData): Promise<Review> {
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, data.order_id))
    .get();

  if (!order) {
    throw createError('Order not found', 404);
  }

  if (order.customer_email !== data.customer_email) {
    throw createError('Email does not match order', 403);
  }

  const customerName = `${order.customer_first_name} ${order.customer_last_name}`;

  const now = new Date().toISOString();
  const newReview: NewReview = {
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

  await db.insert(reviews).values(newReview);

  const mode = await getSettingValue('reviews_mode', 'automatic');
  if (mode === 'automatic') {
    await recalculateFeatured();
  }

  const created = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, newReview.id!))
    .get();

  return created!;
}

export async function getProductReviews(
  productId: string,
  sortBy = 'date',
  sortOrder: 'asc' | 'desc' = 'desc',
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;

  const sortMap: Record<string, any> = {
    date: reviews.created_at,
    rating: reviews.rating,
    name: reviews.customer_name,
  };

  let orderByClause = desc(reviews.created_at);
  if (sortMap[sortBy]) {
    const col = sortMap[sortBy];
    orderByClause = sortOrder === 'asc' ? asc(col) : desc(col);
  }

  const whereClause = and(
    eq(reviews.product_id, productId),
    eq(reviews.status, 'approved'),
  );

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
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

export async function getHomepageReviews() {
  const mode = await getSettingValue('reviews_mode', 'automatic');

  if (mode === 'manual') {
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.is_featured, true), eq(reviews.status, 'approved')))
      .orderBy(asc(reviews.sort_order))
      .limit(5)
      .all();

    const enriched = await Promise.all(rows.map(enrichReviewWithProduct));
    return enriched;
  }

  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, 'approved'))
    .orderBy(desc(reviews.rating), desc(sql`length(${reviews.content})`), desc(reviews.created_at))
    .limit(5)
    .all();

  const enriched = await Promise.all(rows.map(enrichReviewWithProduct));
  return enriched;
}

async function enrichReviewWithProduct(review: any) {
  const product = await db
    .select({ id: products.id, title: products.title, slug: products.slug, primary_image_path: products.primary_image_path })
    .from(products)
    .where(eq(products.id, review.product_id))
    .get();

  return {
    ...review,
    images: parseImages(review.images),
    product: product || null,
  };
}

function parseImages(images: string | null): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAdminReviews(
  filters: ReviewFilters = {},
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (filters.status) {
    conditions.push(eq(reviews.status, filters.status as typeof reviews.$inferSelect['status']));
  }
  if (filters.order_id) {
    conditions.push(eq(reviews.order_id, filters.order_id));
  }
  if (filters.product_id) {
    conditions.push(eq(reviews.product_id, filters.product_id));
  }
  if (filters.rating_min) {
    conditions.push(gte(reviews.rating, filters.rating_min));
  }
  if (filters.rating_max) {
    conditions.push(lte(reviews.rating, filters.rating_max));
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      sql`(${like(reviews.customer_name, term)} OR ${like(reviews.customer_email, term)} OR ${like(reviews.content, term)})`,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortMap: Record<string, any> = {
    created_at: reviews.created_at,
    rating: reviews.rating,
    customer_name: reviews.customer_name,
  };

  let orderByClause = desc(reviews.created_at);
  if (filters.sortBy && sortMap[filters.sortBy]) {
    const col = sortMap[filters.sortBy];
    orderByClause = filters.sortOrder === 'asc' ? asc(col) : desc(col);
  }

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(whereClause),
  ]);

  const enriched = await Promise.all(rows.map(async (r) => {
    const product = await db
      .select({ id: products.id, title: products.title, slug: products.slug })
      .from(products)
      .where(eq(products.id, r.product_id))
      .get();

    const order = await db
      .select({ id: orders.id, order_number: orders.order_number })
      .from(orders)
      .where(eq(orders.id, r.order_id))
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

export async function getReviewById(id: string) {
  const row = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!row) return null;

  const product = await db
    .select({ id: products.id, title: products.title, slug: products.slug })
    .from(products)
    .where(eq(products.id, row.product_id))
    .get();

  const order = await db
    .select({ id: orders.id, order_number: orders.order_number })
    .from(orders)
    .where(eq(orders.id, row.order_id))
    .get();

  return {
    ...row,
    images: parseImages(row.images),
    product: product || null,
    order: order || null,
  };
}

export async function deleteReview(id: string): Promise<void> {
  const existing = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.id, id)).get();
  if (!existing) throw createError('Review not found', 404);

  await db.delete(reviews).where(eq(reviews.id, id));

  const mode = await getSettingValue('reviews_mode', 'automatic');
  if (mode === 'automatic') {
    await recalculateFeatured();
  }
}

export async function updateReview(
  id: string,
  data: { status?: string; is_featured?: boolean },
): Promise<Review> {
  const existing = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  if (!existing) throw createError('Review not found', 404);

  const updateData: Partial<typeof reviews.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (data.status !== undefined) {
    updateData.status = data.status as typeof reviews.$inferSelect['status'];
  }
  if (data.is_featured !== undefined) {
    updateData.is_featured = data.is_featured;
  }

  await db.update(reviews).set(updateData).where(eq(reviews.id, id));

  const updated = await db.select().from(reviews).where(eq(reviews.id, id)).get();
  return updated!;
}

export async function setFeaturedReviews(ids: string[]): Promise<void> {
  await db
    .update(reviews)
    .set({ is_featured: false, sort_order: 0, updated_at: new Date().toISOString() })
    .where(eq(reviews.is_featured, true));

  for (let i = 0; i < ids.length; i++) {
    await db
      .update(reviews)
      .set({ is_featured: true, sort_order: i, updated_at: new Date().toISOString() })
      .where(eq(reviews.id, ids[i]));
  }
}

export async function recalculateFeatured(): Promise<void> {
  const top5 = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, 'approved'))
    .orderBy(desc(reviews.rating), desc(sql`length(${reviews.content})`), desc(reviews.created_at))
    .limit(5)
    .all();

  await db
    .update(reviews)
    .set({ is_featured: false, sort_order: 0, updated_at: new Date().toISOString() })
    .where(eq(reviews.is_featured, true));

  for (let i = 0; i < top5.length; i++) {
    await db
      .update(reviews)
      .set({ is_featured: true, sort_order: i, updated_at: new Date().toISOString() })
      .where(eq(reviews.id, top5[i].id));
  }
}

export async function getOrdersForEmail(email: string) {
  return db
    .select({
      id: orders.id,
      order_number: orders.order_number,
      created_at: orders.created_at,
      total_cents: orders.total_cents,
    })
    .from(orders)
    .where(eq(orders.customer_email, email))
    .orderBy(desc(orders.created_at))
    .all();
}
