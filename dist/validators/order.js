"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const addressSchema = zod_1.z.object({
    line1: zod_1.z.string().min(1, 'Address line 1 is required'),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().length(2, 'State must be a 2-letter code'),
    zip: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
    country: zod_1.z.string().default('US'),
});
exports.createOrderSchema = zod_1.z.object({
    customer_email: zod_1.z.string().email('Invalid email address'),
    customer_first_name: zod_1.z.string().min(1, 'First name is required'),
    customer_last_name: zod_1.z.string().min(1, 'Last name is required'),
    customer_phone: zod_1.z.string().optional(),
    shipping_address: addressSchema.extend({
        type: zod_1.z.enum(['business', 'residential'], {
            errorMap: () => ({ message: 'Shipping type must be business or residential' }),
        }),
    }),
    billing_address: addressSchema.optional(),
    billing_same_as_shipping: zod_1.z.boolean().default(true),
    items: zod_1.z
        .array(zod_1.z.object({
        product_id: zod_1.z.string().uuid('Invalid product ID'),
        quantity: zod_1.z.number().int().min(1).max(10),
    }))
        .min(1, 'At least one item is required'),
    customer_notes: zod_1.z.string().max(1000).optional(),
    stripe_payment_intent_id: zod_1.z.string().min(1, 'Payment intent ID is required'),
});
//# sourceMappingURL=order.js.map