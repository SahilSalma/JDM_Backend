import { z } from 'zod';
export declare const createPaymentIntentSchema: z.ZodObject<{
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
    shipping_type: z.ZodEnum<["forklift", "no_forklift", "liftgate", "residential_delivery"]>;
}, "strip", z.ZodTypeAny, {
    shipping_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    items: {
        quantity: number;
        product_id: string;
    }[];
}, {
    shipping_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    items: {
        quantity: number;
        product_id: string;
    }[];
}>;
export declare const confirmOrderSchema: z.ZodObject<{
    opaque_data_descriptor: z.ZodString;
    opaque_data_value: z.ZodString;
    customer_email: z.ZodString;
    customer_first_name: z.ZodString;
    customer_last_name: z.ZodString;
    customer_phone: z.ZodOptional<z.ZodString>;
    shipping_line1: z.ZodString;
    shipping_line2: z.ZodOptional<z.ZodString>;
    shipping_city: z.ZodString;
    shipping_state: z.ZodString;
    shipping_zip: z.ZodString;
    shipping_country: z.ZodDefault<z.ZodString>;
    shipping_type: z.ZodEnum<["forklift", "no_forklift", "liftgate", "residential_delivery"]>;
    billing_line1: z.ZodOptional<z.ZodString>;
    billing_line2: z.ZodOptional<z.ZodString>;
    billing_city: z.ZodOptional<z.ZodString>;
    billing_state: z.ZodOptional<z.ZodString>;
    billing_zip: z.ZodOptional<z.ZodString>;
    billing_country: z.ZodOptional<z.ZodString>;
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
}, "strip", z.ZodTypeAny, {
    customer_email: string;
    customer_first_name: string;
    customer_last_name: string;
    shipping_line1: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    shipping_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    items: {
        quantity: number;
        product_id: string;
    }[];
    opaque_data_descriptor: string;
    opaque_data_value: string;
    customer_phone?: string | undefined;
    shipping_line2?: string | undefined;
    billing_line1?: string | undefined;
    billing_line2?: string | undefined;
    billing_city?: string | undefined;
    billing_state?: string | undefined;
    billing_zip?: string | undefined;
    billing_country?: string | undefined;
    customer_notes?: string | undefined;
}, {
    customer_email: string;
    customer_first_name: string;
    customer_last_name: string;
    shipping_line1: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    items: {
        quantity: number;
        product_id: string;
    }[];
    opaque_data_descriptor: string;
    opaque_data_value: string;
    customer_phone?: string | undefined;
    shipping_line2?: string | undefined;
    shipping_country?: string | undefined;
    billing_line1?: string | undefined;
    billing_line2?: string | undefined;
    billing_city?: string | undefined;
    billing_state?: string | undefined;
    billing_zip?: string | undefined;
    billing_country?: string | undefined;
    customer_notes?: string | undefined;
}>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
//# sourceMappingURL=checkout.d.ts.map