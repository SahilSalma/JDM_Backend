import { type ShippingType } from './shippingService';
export interface CartItem {
    product_id: string;
    quantity: number;
}
export interface ChargeCardParams {
    amountCents: number;
    opaqueDataDescriptor: string;
    opaqueDataValue: string;
    email: string;
    billingAddress: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    shippingAddress: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}
/**
 * Calculates cart totals, validates stock, and calculates shipping.
 * Returns the computed total cents, subtotal cents, and shipping cents.
 */
export declare function calculateOrderTotal(items: CartItem[], shippingType: ShippingType, stateCode?: string, city?: string): Promise<{
    amount: number;
    shipping: number;
    subtotal: number;
    discount: number;
}>;
/**
 * Executes a credit card charge synchronously via Authorize.net's API using Accept.js opaque token data.
 */
export declare function chargeCard(params: ChargeCardParams): Promise<{
    transactionId: string;
    authCode: string;
}>;
//# sourceMappingURL=paymentService.d.ts.map