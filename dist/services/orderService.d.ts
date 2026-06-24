import { orders } from '../models/schema';
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
export declare function createOrder(data: CreateOrderData): Promise<any>;
export declare function formatOrderResponse(order: any): any;
export declare function getOrders(filters?: OrderFilters, page?: number, limit?: number): Promise<{
    orders: any[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getOrderById(id: string): Promise<any>;
export declare function getOrderByPaymentIntent(paymentIntentId: string): Promise<any>;
export declare function updateOrderStatus(id: string, status?: typeof orders.$inferSelect['status'], adminNotes?: string): Promise<any>;
export declare function updateTracking(id: string, tracking_number: string, carrier: string): Promise<any>;
export declare function lookupOrders(query: {
    order_number?: string;
    email?: string;
    phone?: string;
}, page?: number, limit?: number): Promise<{
    orders: any[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getOrderStats(): Promise<{
    total_orders: number;
    total_revenue_cents: number;
    monthly_orders: number;
    monthly_revenue_cents: number;
    daily_orders: number;
    daily_revenue_cents: number;
    orders_by_status: {
        status: "pending" | "refunded" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
        count: number;
    }[];
    active_products: number;
    low_stock_count: number;
    daily_trend: {
        date: string;
        revenue: number;
        order_count: number;
    }[];
    category_revenue: {
        category: "engine" | "transmission" | "part";
        revenue: number;
        order_count: number;
    }[];
}>;
//# sourceMappingURL=orderService.d.ts.map