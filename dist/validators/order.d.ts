import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    customer_email: z.ZodString;
    customer_first_name: z.ZodString;
    customer_last_name: z.ZodString;
    customer_phone: z.ZodOptional<z.ZodString>;
    shipping_address: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    } & {
        type: z.ZodEnum<["business", "residential"]>;
    }, "strip", z.ZodTypeAny, {
        type: "business" | "residential";
        city: string;
        state: string;
        line1: string;
        zip: string;
        country: string;
        line2?: string | undefined;
    }, {
        type: "business" | "residential";
        city: string;
        state: string;
        line1: string;
        zip: string;
        line2?: string | undefined;
        country?: string | undefined;
    }>;
    billing_address: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city: string;
        state: string;
        line1: string;
        zip: string;
        country: string;
        line2?: string | undefined;
    }, {
        city: string;
        state: string;
        line1: string;
        zip: string;
        line2?: string | undefined;
        country?: string | undefined;
    }>>;
    billing_same_as_shipping: z.ZodDefault<z.ZodBoolean>;
    items: z.ZodArray<z.ZodObject<{
        product_id: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        product_id: string;
    }, {
        quantity: number;
        product_id: string;
    }>, "many">;
    customer_notes: z.ZodOptional<z.ZodString>;
    stripe_payment_intent_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    customer_email: string;
    customer_first_name: string;
    customer_last_name: string;
    stripe_payment_intent_id: string;
    items: {
        quantity: number;
        product_id: string;
    }[];
    shipping_address: {
        type: "business" | "residential";
        city: string;
        state: string;
        line1: string;
        zip: string;
        country: string;
        line2?: string | undefined;
    };
    billing_same_as_shipping: boolean;
    customer_phone?: string | undefined;
    customer_notes?: string | undefined;
    billing_address?: {
        city: string;
        state: string;
        line1: string;
        zip: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
}, {
    customer_email: string;
    customer_first_name: string;
    customer_last_name: string;
    stripe_payment_intent_id: string;
    items: {
        quantity: number;
        product_id: string;
    }[];
    shipping_address: {
        type: "business" | "residential";
        city: string;
        state: string;
        line1: string;
        zip: string;
        line2?: string | undefined;
        country?: string | undefined;
    };
    customer_phone?: string | undefined;
    customer_notes?: string | undefined;
    billing_address?: {
        city: string;
        state: string;
        line1: string;
        zip: string;
        line2?: string | undefined;
        country?: string | undefined;
    } | undefined;
    billing_same_as_shipping?: boolean | undefined;
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
//# sourceMappingURL=order.d.ts.map