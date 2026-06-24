"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.formatOrderResponse = formatOrderResponse;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.getOrderByPaymentIntent = getOrderByPaymentIntent;
exports.updateOrderStatus = updateOrderStatus;
exports.updateTracking = updateTracking;
exports.lookupOrders = lookupOrders;
exports.getOrderStats = getOrderStats;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const orderNumber_1 = require("../utils/orderNumber");
const errorHandler_1 = require("../middleware/errorHandler");
const inventoryService_1 = require("./inventoryService");
async function createOrder(data) {
    const { items, ...orderData } = data;
    const orderId = crypto.randomUUID();
    const orderNumber = (0, orderNumber_1.generateOrderNumber)();
    const now = new Date().toISOString();
    const newOrder = {
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
    await database_1.db.insert(schema_1.orders).values(newOrder);
    const orderItemsData = items.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.unit_price_cents * item.quantity,
        product_title: item.product_title,
        product_sku: item.product_sku,
    }));
    await database_1.db.insert(schema_1.orderItems).values(orderItemsData);
    // Decrement stock for each item
    for (const item of items) {
        await (0, inventoryService_1.decrementStock)(item.product_id, item.quantity);
    }
    return getOrderById(orderId);
}
function formatOrderResponse(order) {
    if (!order)
        return null;
    const hasSeparateBilling = order.billing_line1 &&
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
async function getOrders(filters = {}, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters.status) {
        const statuses = filters.status.split(',').map((s) => s.trim()).filter(Boolean);
        if (statuses.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.status, statuses[0]));
        }
        else if (statuses.length > 1) {
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.orders.status, statuses));
        }
    }
    if (filters.payment_status) {
        const paymentStatuses = filters.payment_status.split(',').map((s) => s.trim()).filter(Boolean);
        if (paymentStatuses.length === 1) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, paymentStatuses[0]));
        }
        else if (paymentStatuses.length > 1) {
            conditions.push((0, drizzle_orm_1.inArray)(schema_1.orders.payment_status, paymentStatuses));
        }
    }
    if (filters.customer_email) {
        conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.customer_email, filters.customer_email));
    }
    if (filters.from_date) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.orders.created_at} >= ${filters.from_date}`);
    }
    if (filters.to_date) {
        conditions.push((0, drizzle_orm_1.sql) `${schema_1.orders.created_at} <= ${filters.to_date}`);
    }
    if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.orders.order_number, searchTerm), (0, drizzle_orm_1.like)(schema_1.orders.customer_email, searchTerm), (0, drizzle_orm_1.like)(schema_1.orders.customer_first_name, searchTerm), (0, drizzle_orm_1.like)(schema_1.orders.customer_last_name, searchTerm)));
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const sortColumnMap = {
        order_number: schema_1.orders.order_number,
        created_at: schema_1.orders.created_at,
        status: schema_1.orders.status,
        payment_status: schema_1.orders.payment_status,
        total_cents: schema_1.orders.total_cents,
    };
    let orderByClause = (0, drizzle_orm_1.desc)(schema_1.orders.created_at);
    if (filters.sortBy && sortColumnMap[filters.sortBy]) {
        const col = sortColumnMap[filters.sortBy];
        orderByClause = filters.sortOrder === 'asc' ? (0, drizzle_orm_1.asc)(col) : (0, drizzle_orm_1.desc)(col);
    }
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.orders)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.orders)
            .where(whereClause),
    ]);
    return {
        orders: rows.map(formatOrderResponse),
        total: countRows[0]?.count ?? 0,
        page,
        limit,
    };
}
async function getOrderById(id) {
    const order = await database_1.db.select().from(schema_1.orders).where((0, drizzle_orm_1.eq)(schema_1.orders.id, id)).get();
    if (!order)
        return null;
    const items = await database_1.db.select().from(schema_1.orderItems).where((0, drizzle_orm_1.eq)(schema_1.orderItems.order_id, id));
    return formatOrderResponse({ ...order, items });
}
async function getOrderByPaymentIntent(paymentIntentId) {
    const order = await database_1.db
        .select()
        .from(schema_1.orders)
        .where((0, drizzle_orm_1.eq)(schema_1.orders.stripe_payment_intent_id, paymentIntentId))
        .get();
    if (!order)
        return null;
    return getOrderById(order.id);
}
async function updateOrderStatus(id, status, adminNotes) {
    const existing = await database_1.db.select({ id: schema_1.orders.id }).from(schema_1.orders).where((0, drizzle_orm_1.eq)(schema_1.orders.id, id)).get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Order not found', 404);
    const updateData = {
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
    await database_1.db.update(schema_1.orders).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.orders.id, id));
    return getOrderById(id);
}
async function updateTracking(id, tracking_number, carrier) {
    const existing = await database_1.db.select({ id: schema_1.orders.id }).from(schema_1.orders).where((0, drizzle_orm_1.eq)(schema_1.orders.id, id)).get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Order not found', 404);
    await database_1.db
        .update(schema_1.orders)
        .set({
        tracking_number,
        carrier,
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id));
    return getOrderById(id);
}
async function lookupOrders(query, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    if (query.order_number) {
        const order = await database_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.order_number, query.order_number))
            .get();
        if (!order)
            return { orders: [], total: 0, page, limit };
        const items = await database_1.db.select().from(schema_1.orderItems).where((0, drizzle_orm_1.eq)(schema_1.orderItems.order_id, order.id));
        return { orders: [formatOrderResponse({ ...order, items })], total: 1, page: 1, limit };
    }
    const condition = query.email
        ? (0, drizzle_orm_1.eq)(schema_1.orders.customer_email, query.email)
        : query.phone
            ? (0, drizzle_orm_1.eq)(schema_1.orders.customer_phone, query.phone)
            : undefined;
    if (!condition)
        return { orders: [], total: 0, page, limit };
    const [rows, countRows] = await Promise.all([
        database_1.db
            .select()
            .from(schema_1.orders)
            .where(condition)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.created_at))
            .limit(limit)
            .offset(offset),
        database_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.orders)
            .where(condition),
    ]);
    // Fetch items for each order
    const ordersWithItems = await Promise.all(rows.map(async (order) => {
        const items = await database_1.db.select().from(schema_1.orderItems).where((0, drizzle_orm_1.eq)(schema_1.orderItems.order_id, order.id));
        return formatOrderResponse({ ...order, items });
    }));
    return {
        orders: ordersWithItems,
        total: countRows[0]?.count ?? 0,
        page,
        limit,
    };
}
async function getOrderStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    // 30 days ago for trend data
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [totals, monthly, daily, byStatus, productStats, dailyTrend, categoryRevenue] = await Promise.all([
        database_1.db
            .select({
            total_orders: (0, drizzle_orm_1.sql) `count(*)`,
            total_revenue: (0, drizzle_orm_1.sql) `sum(total_cents)`,
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, 'paid')),
        database_1.db
            .select({
            monthly_orders: (0, drizzle_orm_1.sql) `count(*)`,
            monthly_revenue: (0, drizzle_orm_1.sql) `sum(total_cents)`,
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, 'paid'), (0, drizzle_orm_1.sql) `${schema_1.orders.created_at} >= ${startOfMonth}`)),
        database_1.db
            .select({
            daily_orders: (0, drizzle_orm_1.sql) `count(*)`,
            daily_revenue: (0, drizzle_orm_1.sql) `sum(total_cents)`,
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, 'paid'), (0, drizzle_orm_1.sql) `${schema_1.orders.created_at} >= ${startOfDay}`)),
        database_1.db
            .select({
            status: schema_1.orders.status,
            count: (0, drizzle_orm_1.sql) `count(*)`,
        })
            .from(schema_1.orders)
            .groupBy(schema_1.orders.status),
        database_1.db
            .select({
            active_products: (0, drizzle_orm_1.sql) `count(*)`,
            low_stock: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.products.quantity} <= 5 then 1 else 0 end)`,
        })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)),
        // 30-day daily revenue trend
        database_1.db
            .select({
            date: (0, drizzle_orm_1.sql) `date(${schema_1.orders.created_at})`,
            revenue: (0, drizzle_orm_1.sql) `sum(total_cents)`,
            order_count: (0, drizzle_orm_1.sql) `count(*)`,
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, 'paid'), (0, drizzle_orm_1.sql) `${schema_1.orders.created_at} >= ${thirtyDaysAgo}`))
            .groupBy((0, drizzle_orm_1.sql) `date(${schema_1.orders.created_at})`)
            .orderBy((0, drizzle_orm_1.sql) `date(${schema_1.orders.created_at})`),
        // Revenue by product category
        database_1.db
            .select({
            category: schema_1.products.category,
            revenue: (0, drizzle_orm_1.sql) `sum(${schema_1.orderItems.total_cents})`,
            order_count: (0, drizzle_orm_1.sql) `count(distinct ${schema_1.orderItems.order_id})`,
        })
            .from(schema_1.orderItems)
            .innerJoin(schema_1.products, (0, drizzle_orm_1.eq)(schema_1.orderItems.product_id, schema_1.products.id))
            .innerJoin(schema_1.orders, (0, drizzle_orm_1.eq)(schema_1.orderItems.order_id, schema_1.orders.id))
            .where((0, drizzle_orm_1.eq)(schema_1.orders.payment_status, 'paid'))
            .groupBy(schema_1.products.category),
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
//# sourceMappingURL=orderService.js.map