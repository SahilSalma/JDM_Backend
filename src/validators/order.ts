import { z } from 'zod';

const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
  country: z.string().default('US'),
});

export const createOrderSchema = z.object({
  customer_email: z.string().email('Invalid email address'),
  customer_first_name: z.string().min(1, 'First name is required'),
  customer_last_name: z.string().min(1, 'Last name is required'),
  customer_phone: z.string().optional(),
  shipping_address: addressSchema.extend({
    type: z.enum(['business', 'residential'], {
      errorMap: () => ({ message: 'Shipping type must be business or residential' }),
    }),
  }),
  billing_address: addressSchema.optional(),
  billing_same_as_shipping: z.boolean().default(true),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, 'At least one item is required'),
  customer_notes: z.string().max(1000).optional(),
  stripe_payment_intent_id: z.string().min(1, 'Payment intent ID is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
