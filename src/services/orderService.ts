import { eq, and, sql, desc, asc, like, or, inArray } from 'drizzle-orm';
import { db } from '../config/database';
import { orders, orderItems, products } from '../models/schema';
import type { NewOrder, NewOrderItem } from '../models/schema';
import { generateOrderNumber } from '../utils/orderNumber';
import { createError } from '../middleware/errorHandler';
import { decrementStock } from './inventoryService';

export interface OrderFilters {
  status?: string;
  payment_status?: string;
  customer_email?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderData {
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  shipping_line1: string;
  shipping_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country?: string;
  shipping_type: string;
  billing_line1?: string;
  billing_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents?: number;
  total_cents: number;
  stripe_payment_intent_id?: string;
  authorizenet_transaction_id?: string;
  customer_notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    product_title: string;
    product_sku: string;
  }>;
}

export async function createOrder(data: CreateOrderData) {
  const { items, ...orderData } = data;

  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();

  const newOrder: NewOrder = {
    ...orderData,
    id: orderId,
    order_number: orderNumber,
    shipping_country: orderData.shipping_country ?? 'US',
    tax_cents: orderData.tax_cents ?? 0,
    payment_status: 'paid',
    status: 'confirmed',
    created_at: now,
    updated_at: now,
  };

  await db.insert(orders).values(newOrder);

  const orderItemsData: NewOrderItem[] = items.map((item) => ({
    id: crypto.randomUUID(),
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    total_cents: item.unit_price_cents * item.quantity,
    product_title: item.product_title,
    product_sku: item.product_sku,
  }));

  await db.insert(orderItems).values(orderItemsData);

  // Decrement stock for each item
  for (const item of items) {
    await decrementStock(item.product_id, item.quantity);
  }

  return getOrderById(orderId);
}

export function formatOrderResponse(order: any) {
  if (!order) return null;

  const hasSeparateBilling =
    order.billing_line1 &&
    (order.billing_line1 !== order.shipping_line1 ||
     order.billing_city !== order.shipping_city);

  return {
    ...order,
    customer_name: `${order.customer_first_name} ${order.customer_last_name}`,
    shipping_address: {
      address: order.shipping_line1,
      address2: order.shipping_line2 || null,
      city: order.shipping_city,
      state: order.shipping_state,
      zip: order.shipping_zip,
      country: order.shipping_country,
      type: order.shipping_type,
    },
    billing_address: hasSeparateBilling
      ? {
          address: order.billing_line1,
          address2: order.billing_line2 || null,
          city: order.billing_city,
          state: order.billing_state,
          zip: order.billing_zip,
          country: order.billing_country,
        }
      : null,
  };
}

export async function getOrders(
  filters: OrderFilters = {},
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      conditions.push(eq(orders.status, statuses[0] as typeof orders.$inferSelect['status']));
    } else if (statuses.length > 1) {
      conditions.push(inArray(orders.status, statuses as (typeof orders.$inferSelect['status'])[]));
    }
  }
  if (filters.payment_status) {
    const paymentStatuses = filters.payment_status.split(',').map((s) => s.trim()).filter(Boolean);
    if (paymentStatuses.length === 1) {
      conditions.push(
        eq(orders.payment_status, paymentStatuses[0] as typeof orders.$inferSelect['payment_status']),
      );
    } else if (paymentStatuses.length > 1) {
      conditions.push(
        inArray(orders.payment_status, paymentStatuses as (typeof orders.$inferSelect['payment_status'])[]),
      );
    }
  }
  if (filters.customer_email) {
    conditions.push(eq(orders.customer_email, filters.customer_email));
  }
  if (filters.from_date) {
    conditions.push(sql`${orders.created_at} >= ${filters.from_date}` as ReturnType<typeof eq>);
  }
  if (filters.to_date) {
    conditions.push(sql`${orders.created_at} <= ${filters.to_date}` as ReturnType<typeof eq>);
  }
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(orders.order_number, searchTerm),
        like(orders.customer_email, searchTerm),
        like(orders.customer_first_name, searchTerm),
        like(orders.customer_last_name, searchTerm),
      ) as ReturnType<typeof eq>,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumnMap: Record<string, any> = {
    order_number: orders.order_number,
    created_at: orders.created_at,
    status: orders.status,
    payment_status: orders.payment_status,
    total_cents: orders.total_cents,
  };

  let orderByClause = desc(orders.created_at);
  if (filters.sortBy && sortColumnMap[filters.sortBy]) {
    const col = sortColumnMap[filters.sortBy];
    orderByClause = filters.sortOrder === 'asc' ? asc(col) : desc(col);
  }

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause),
  ]);

  return {
    orders: rows.map(formatOrderResponse),
    total: countRows[0]?.count ?? 0,
    page,
    limit,
  };
}

export async function getOrderById(id: string) {
  const order = await db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.order_id, id));

  return formatOrderResponse({ ...order, items });
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.stripe_payment_intent_id, paymentIntentId))
    .get();

  if (!order) return null;
  return getOrderById(order.id);
}

export async function updateOrderStatus(
  id: string,
  status?: typeof orders.$inferSelect['status'],
  adminNotes?: string,
) {
  const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).get();
  if (!existing) throw createError('Order not found', 404);

  const updateData: Partial<typeof orders.$inferInsert> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) {
    updateData.status = status;
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }
  }

  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, id));
  return getOrderById(id);
}

export async function updateTracking(id: string, tracking_number: string, carrier: string) {
  const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).get();
  if (!existing) throw createError('Order not found', 404);

  await db
    .update(orders)
    .set({
      tracking_number,
      carrier,
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(orders.id, id));

  return getOrderById(id);
}

export async function lookupOrders(
  query: { order_number?: string; email?: string; phone?: string },
  page = 1,
  limit = 10,
) {
  const offset = (page - 1) * limit;

  if (query.order_number) {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.order_number, query.order_number))
      .get();
    if (!order) return { orders: [], total: 0, page, limit };
    const items = await db.select().from(orderItems).where(eq(orderItems.order_id, order.id));
    return { orders: [formatOrderResponse({ ...order, items })], total: 1, page: 1, limit };
  }

  const condition = query.email
    ? eq(orders.customer_email, query.email)
    : query.phone
      ? eq(orders.customer_phone, query.phone!)
      : undefined;

  if (!condition) return { orders: [], total: 0, page, limit };

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(condition)
      .orderBy(desc(orders.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(condition),
  ]);

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    rows.map(async (order) => {
      const items = await db.select().from(orderItems).where(eq(orderItems.order_id, order.id));
      return formatOrderResponse({ ...order, items });
    }),
  );

  return {
    orders: ordersWithItems,
    total: countRows[0]?.count ?? 0,
    page,
    limit,
  };
}

export async function getOrderStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // 30 days ago for trend data
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totals, monthly, daily, byStatus, productStats, dailyTrend, categoryRevenue] = await Promise.all([
    db
      .select({
        total_orders: sql<number>`count(*)`,
        total_revenue: sql<number>`sum(total_cents)`,
      })
      .from(orders)
      .where(eq(orders.payment_status, 'paid')),
    db
      .select({
        monthly_orders: sql<number>`count(*)`,
        monthly_revenue: sql<number>`sum(total_cents)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, 'paid'),
          sql`${orders.created_at} >= ${startOfMonth}`,
        ),
      ),
    db
      .select({
        daily_orders: sql<number>`count(*)`,
        daily_revenue: sql<number>`sum(total_cents)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, 'paid'),
          sql`${orders.created_at} >= ${startOfDay}`,
        ),
      ),
    db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({
        active_products: sql<number>`count(*)`,
        low_stock: sql<number>`sum(case when ${products.quantity} <= 5 then 1 else 0 end)`,
      })
      .from(products)
      .where(eq(products.is_deleted, false)),
    // 30-day daily revenue trend
    db
      .select({
        date: sql<string>`date(${orders.created_at})`,
        revenue: sql<number>`sum(total_cents)`,
        order_count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.payment_status, 'paid'),
          sql`${orders.created_at} >= ${thirtyDaysAgo}`,
        ),
      )
      .groupBy(sql`date(${orders.created_at})`)
      .orderBy(sql`date(${orders.created_at})`),
    // Revenue by product category
    db
      .select({
        category: products.category,
        revenue: sql<number>`sum(${orderItems.total_cents})`,
        order_count: sql<number>`count(distinct ${orderItems.order_id})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.product_id, products.id))
      .innerJoin(orders, eq(orderItems.order_id, orders.id))
      .where(eq(orders.payment_status, 'paid'))
      .groupBy(products.category),
  ]);

  return {
    total_orders: totals[0]?.total_orders ?? 0,
    total_revenue_cents: totals[0]?.total_revenue ?? 0,
    monthly_orders: monthly[0]?.monthly_orders ?? 0,
    monthly_revenue_cents: monthly[0]?.monthly_revenue ?? 0,
    daily_orders: daily[0]?.daily_orders ?? 0,
    daily_revenue_cents: daily[0]?.daily_revenue ?? 0,
    orders_by_status: byStatus,
    active_products: productStats[0]?.active_products ?? 0,
    low_stock_count: productStats[0]?.low_stock ?? 0,
    daily_trend: dailyTrend,
    category_revenue: categoryRevenue,
  };
}

