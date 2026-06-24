"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomers = listCustomers;
exports.getCustomerDetails = getCustomerDetails;
exports.subscribeNewsletter = subscribeNewsletter;
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * List all unique customers grouped by email.
 * Returns order count, lifetime value, and last order date.
 */
async function listCustomers(req, res, next) {
    try {
        const { search, page, limit, sortBy, sortOrder, ltv_tier, order_volume, recency } = req.query;
        const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));
        const offset = (pageNum - 1) * limitNum;
        // Build WHERE conditions for search
        let searchClause = (0, drizzle_orm_1.sql) `1 = 1`;
        if (search) {
            const searchTerm = `%${String(search)}%`;
            searchClause = (0, drizzle_orm_1.sql) `(
        ${schema_1.orders.customer_email} LIKE ${searchTerm}
        OR ${schema_1.orders.customer_first_name} LIKE ${searchTerm}
        OR ${schema_1.orders.customer_last_name} LIKE ${searchTerm}
        OR ${schema_1.orders.customer_phone} LIKE ${searchTerm}
      )`;
        }
        // Build HAVING conditions for filters
        const havingConditions = [];
        if (ltv_tier) {
            const tiers = String(ltv_tier).split(',').map((t) => t.trim()).filter(Boolean);
            const tierConditions = tiers.map((tier) => {
                if (tier === 'high')
                    return 'SUM(total_cents) >= 100000';
                if (tier === 'medium')
                    return 'SUM(total_cents) >= 20000 AND SUM(total_cents) < 100000';
                if (tier === 'low')
                    return 'SUM(total_cents) < 20000';
                return null;
            }).filter(Boolean);
            if (tierConditions.length > 0) {
                havingConditions.push(`(${tierConditions.join(' OR ')})`);
            }
        }
        if (order_volume) {
            const volumes = String(order_volume).split(',').map((v) => v.trim()).filter(Boolean);
            const volumeConditions = volumes.map((volume) => {
                if (volume === 'frequent')
                    return 'COUNT(*) >= 5';
                if (volume === 'repeat')
                    return 'COUNT(*) >= 2 AND COUNT(*) < 5';
                if (volume === 'onetime')
                    return 'COUNT(*) = 1';
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
                if (r === 'active')
                    return `MAX(created_at) >= '${date30DaysAgo}'`;
                if (r === 'slipping')
                    return `MAX(created_at) >= '${date90DaysAgo}' AND MAX(created_at) < '${date30DaysAgo}'`;
                if (r === 'inactive')
                    return `MAX(created_at) < '${date90DaysAgo}'`;
                return null;
            }).filter(Boolean);
            if (recencyConditions.length > 0) {
                havingConditions.push(`(${recencyConditions.join(' OR ')})`);
            }
        }
        const havingClause = havingConditions.length > 0
            ? (0, drizzle_orm_1.sql) `HAVING ${drizzle_orm_1.sql.raw(havingConditions.join(' AND '))}`
            : (0, drizzle_orm_1.sql) ``;
        // Dynamic sort mapping
        const sortMap = {
            email: 'customer_email',
            name: 'customer_first_name',
            orders: 'order_count',
            ltv: 'lifetime_value',
            last_order: 'last_order_date',
        };
        const sortCol = sortMap[String(sortBy || '')] || 'last_order_date';
        const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
        const rows = await database_1.db.all((0, drizzle_orm_1.sql) `
      SELECT
        customer_email,
        customer_first_name,
        customer_last_name,
        customer_phone,
        COUNT(*) as order_count,
        SUM(total_cents) as lifetime_value,
        MAX(created_at) as last_order_date
      FROM ${schema_1.orders}
      WHERE ${searchClause}
      GROUP BY customer_email
      ${havingClause}
      ORDER BY ${drizzle_orm_1.sql.raw(sortCol)} ${drizzle_orm_1.sql.raw(sortDir)}
      LIMIT ${limitNum} OFFSET ${offset}
    `);
        const countRows = await database_1.db.all((0, drizzle_orm_1.sql) `
      SELECT COUNT(*) as total FROM (
        SELECT customer_email
        FROM ${schema_1.orders}
        WHERE ${searchClause}
        GROUP BY customer_email
        ${havingClause}
      )
    `);
        const total = countRows[0]?.total ?? 0;
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
    }
    catch (err) {
        next(err);
    }
}
/**
 * Get detailed customer profile by email.
 * Returns customer info, all orders with items, and aggregated stats.
 */
async function getCustomerDetails(req, res, next) {
    try {
        const email = decodeURIComponent(String(req.params.email));
        // Get all orders for this customer
        const customerOrders = await database_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.customer_email, email))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.created_at));
        if (customerOrders.length === 0) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }
        // Get items for each order
        const ordersWithItems = await Promise.all(customerOrders.map(async (order) => {
            const items = await database_1.db
                .select()
                .from(schema_1.orderItems)
                .where((0, drizzle_orm_1.eq)(schema_1.orderItems.order_id, order.id));
            return { ...order, items };
        }));
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
            shipping_addresses: [...new Set(customerOrders.map((o) => `${o.shipping_line1}, ${o.shipping_city}, ${o.shipping_state} ${o.shipping_zip}`))],
        };
        res.json({
            success: true,
            data: {
                customer,
                orders: ordersWithItems,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
/**
 * Public subscription handler for newsletter.
 */
async function subscribeNewsletter(req, res, next) {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ success: false, error: 'Email is required' });
            return;
        }
        const trimmedEmail = email.trim().toLowerCase();
        // Check if already exists in subscriptions
        const existing = await database_1.db
            .select()
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.email, trimmedEmail))
            .limit(1);
        if (existing.length > 0) {
            if (!existing[0].is_active) {
                await database_1.db
                    .update(schema_1.subscriptions)
                    .set({
                    is_active: true,
                    subscribed_at: new Date().toISOString()
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, existing[0].id));
                res.json({ success: true, message: 'Re-subscribed successfully!' });
                return;
            }
            res.json({ success: true, message: 'Already subscribed!' });
            return;
        }
        // Create new subscription
        const uuid = (await Promise.resolve().then(() => __importStar(require('crypto')))).randomUUID();
        await database_1.db.insert(schema_1.subscriptions).values({
            id: uuid,
            email: trimmedEmail,
            source: 'footer',
            subscribed_at: new Date().toISOString(),
            is_active: true
        });
        res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=customerController.js.map