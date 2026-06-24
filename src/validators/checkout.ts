import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, 'At least one item is required'),
  shipping_type: z.enum(['forklift', 'no_forklift', 'liftgate', 'residential_delivery'], {
    errorMap: () => ({ message: 'Shipping type must be forklift, no_forklift, liftgate, or residential_delivery' }),
  }),
});

export const confirmOrderSchema = z.object({
  opaque_data_descriptor: z.string().min(1, 'Payment descriptor is required'),
  opaque_data_value: z.string().min(1, 'Payment nonce is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_first_name: z.string().min(1, 'First name is required'),
  customer_last_name: z.string().min(1, 'Last name is required'),
  customer_phone: z.string().optional(),
  shipping_line1: z.string().min(1, 'Shipping address line 1 is required'),
  shipping_line2: z.string().optional(),
  shipping_city: z.string().min(1, 'City is required'),
  shipping_state: z.string().length(2, 'State must be a 2-letter code'),
  shipping_zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be valid'),
  shipping_country: z.string().default('US'),
  shipping_type: z.enum(['forklift', 'no_forklift', 'liftgate', 'residential_delivery']),
  billing_line1: z.string().optional(),
  billing_line2: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_zip: z.string().optional(),
  billing_country: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  customer_notes: z.string().max(1000).optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
