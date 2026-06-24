import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { orders, orderItems, subscriptions } from '../models/schema';
import { eq, sql, desc, like, or } from 'drizzle-orm';

/**
 * List all unique customers grouped by email.
 * Returns order count, lifetime value, and last order date.
 */
export async function listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, page, limit, sortBy, sortOrder, ltv_tier, order_volume, recency } = req.query;
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions for search
    let searchClause = sql`1 = 1`;
    if (search) {
      const searchTerm = `%${String(search)}%`;
      searchClause = sql`(
        ${orders.customer_email} LIKE ${searchTerm}
        OR ${orders.customer_first_name} LIKE ${searchTerm}
        OR ${orders.customer_last_name} LIKE ${searchTerm}
        OR ${orders.customer_phone} LIKE ${searchTerm}
      )`;
    }

    // Build HAVING conditions for filters
    const havingConditions: string[] = [];

    if (ltv_tier) {
      const tiers = String(ltv_tier).split(',').map((t) => t.trim()).filter(Boolean);
      const tierConditions = tiers.map((tier) => {
        if (tier === 'high') return 'SUM(total_cents) >= 100000';
        if (tier === 'medium') return 'SUM(total_cents) >= 20000 AND SUM(total_cents) < 100000';
        if (tier === 'low') return 'SUM(total_cents) < 20000';
        return null;
      }).filter(Boolean);
      
      if (tierConditions.length > 0) {
        havingConditions.push(`(${tierConditions.join(' OR ')})`);
      }
    }

    if (order_volume) {
      const volumes = String(order_volume).split(',').map((v) => v.trim()).filter(Boolean);
      const volumeConditions = volumes.map((volume) => {
        if (volume === 'frequent') return 'COUNT(*) >= 5';
        if (volume === 'repeat') return 'COUNT(*) >= 2 AND COUNT(*) < 5';
        if (volume === 'onetime') return 'COUNT(*) = 1';
        return null;
      }).filter(Boolean);

      if (volumeConditions.length > 0) {
        havingConditions.push(`(${volumeConditions.join(' OR ')})`);
      }
    }

    if (recency) {
      const recencies = String(recency).split(',').map((r) => r.trim()).filter(Boolean);
      const now = new Date();
      const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const recencyConditions = recencies.map((r) => {
        if (r === 'active') return `MAX(created_at) >= '${date30DaysAgo}'`;
        if (r === 'slipping') return `MAX(created_at) >= '${date90DaysAgo}' AND MAX(created_at) < '${date30DaysAgo}'`;
        if (r === 'inactive') return `MAX(created_at) < '${date90DaysAgo}'`;
        return null;
      }).filter(Boolean);

      if (recencyConditions.length > 0) {
        havingConditions.push(`(${recencyConditions.join(' OR ')})`);
      }
    }

    const havingClause = havingConditions.length > 0
      ? sql`HAVING ${sql.raw(havingConditions.join(' AND '))}`
      : sql``;

    // Dynamic sort mapping
    const sortMap: Record<string, string> = {
      email: 'customer_email',
      name: 'customer_first_name',
      orders: 'order_count',
      ltv: 'lifetime_value',
      last_order: 'last_order_date',
    };
    const sortCol = sortMap[String(sortBy || '')] || 'last_order_date';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const rows = await db.all(sql`
      SELECT
        customer_email,
        customer_first_name,
        customer_last_name,
        customer_phone,
        COUNT(*) as order_count,
        SUM(total_cents) as lifetime_value,
        MAX(created_at) as last_order_date
      FROM ${orders}
      WHERE ${searchClause}
      GROUP BY customer_email
      ${havingClause}
      ORDER BY ${sql.raw(sortCol)} ${sql.raw(sortDir)}
      LIMIT ${limitNum} OFFSET ${offset}
    `);

    const countRows = await db.all(sql`
      SELECT COUNT(*) as total FROM (
        SELECT customer_email
        FROM ${orders}
        WHERE ${searchClause}
        GROUP BY customer_email
        ${havingClause}
      )
    `);

    const total = (countRows[0] as any)?.total ?? 0;

    res.json({
      success: true,
      data: rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get detailed customer profile by email.
 * Returns customer info, all orders with items, and aggregated stats.
 */
export async function getCustomerDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = decodeURIComponent(String(req.params.email));

    // Get all orders for this customer
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customer_email, email))
      .orderBy(desc(orders.created_at));

    if (customerOrders.length === 0) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.order_id, order.id));
        return { ...order, items };
      }),
    );

    // Aggregate stats
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_cents, 0);
    const paidOrders = customerOrders.filter((o) => o.payment_status === 'paid');
    const paidRevenue = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);

    const firstOrder = customerOrders[customerOrders.length - 1];

    const customer = {
      email: firstOrder.customer_email,
      first_name: firstOrder.customer_first_name,
      last_name: firstOrder.customer_last_name,
      phone: firstOrder.customer_phone,
      total_orders: customerOrders.length,
      total_spent: totalSpent,
      paid_revenue: paidRevenue,
      first_order_date: firstOrder.created_at,
      last_order_date: customerOrders[0].created_at,
      shipping_addresses: [...new Set(customerOrders.map((o) =>
        `${o.shipping_line1}, ${o.shipping_city}, ${o.shipping_state} ${o.shipping_zip}`
      ))],
    };

    res.json({
      success: true,
      data: {
        customer,
        orders: ordersWithItems,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public subscription handler for newsletter.
 */
export async function subscribeNewsletter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if already exists in subscriptions
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, trimmedEmail))
      .limit(1);

    if (existing.length > 0) {
      if (!existing[0].is_active) {
        await db
          .update(subscriptions)
          .set({
            is_active: true,
            subscribed_at: new Date().toISOString()
          })
          .where(eq(subscriptions.id, existing[0].id));
        res.json({ success: true, message: 'Re-subscribed successfully!' });
        return;
      }
      res.json({ success: true, message: 'Already subscribed!' });
      return;
    }

    // Create new subscription
    const uuid = (await import('crypto')).randomUUID();
    await db.insert(subscriptions).values({
      id: uuid,
      email: trimmedEmail,
      source: 'footer',
      subscribed_at: new Date().toISOString(),
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    next(err);
  }
}
