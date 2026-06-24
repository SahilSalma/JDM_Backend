"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmOrderSchema = exports.createPaymentIntentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentIntentSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        product_id: zod_1.z.string().uuid('Invalid product ID'),
        quantity: zod_1.z.number().int().min(1).max(10),
    }))
        .min(1, 'At least one item is required'),
    shipping_type: zod_1.z.enum(['forklift', 'no_forklift', 'liftgate', 'residential_delivery'], {
        errorMap: () => ({ message: 'Shipping type must be forklift, no_forklift, liftgate, or residential_delivery' }),
    }),
});
exports.confirmOrderSchema = zod_1.z.object({
    opaque_data_descriptor: zod_1.z.string().min(1, 'Payment descriptor is required'),
    opaque_data_value: zod_1.z.string().min(1, 'Payment nonce is required'),
    customer_email: zod_1.z.string().email('Invalid email address'),
    customer_first_name: zod_1.z.string().min(1, 'First name is required'),
    customer_last_name: zod_1.z.string().min(1, 'Last name is required'),
    customer_phone: zod_1.z.string().optional(),
    shipping_line1: zod_1.z.string().min(1, 'Shipping address line 1 is required'),
    shipping_line2: zod_1.z.string().optional(),
    shipping_city: zod_1.z.string().min(1, 'City is required'),
    shipping_state: zod_1.z.string().length(2, 'State must be a 2-letter code'),
    shipping_zip: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be valid'),
    shipping_country: zod_1.z.string().default('US'),
    shipping_type: zod_1.z.enum(['forklift', 'no_forklift', 'liftgate', 'residential_delivery']),
    billing_line1: zod_1.z.string().optional(),
    billing_line2: zod_1.z.string().optional(),
    billing_city: zod_1.z.string().optional(),
    billing_state: zod_1.z.string().optional(),
    billing_zip: zod_1.z.string().optional(),
    billing_country: zod_1.z.string().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        product_id: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().int().min(1),
    }))
        .min(1),
    customer_notes: zod_1.z.string().max(1000).optional(),
});
//# sourceMappingURL=checkout.js.map