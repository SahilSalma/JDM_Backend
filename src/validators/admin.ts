import { z } from 'zod';

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]).optional(),
  admin_notes: z.string().optional(),
});

export const updateTrackingSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().min(1, 'Carrier is required'),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reason: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  rule_key: z.string().min(1),
  rule_value: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const sendEmailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  template_enabled: z.boolean().default(false),
  order_id: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        path: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .optional(),
});

export const createBlogSchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  featured_image_path: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  published_at: z.string().datetime().optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const createShippingZoneSchema = z.object({
  state_code: z.string().length(2).optional().nullable(),
  city: z.string().optional().nullable(),
  zone_type: z.enum(['forklift', 'no_forklift', 'liftgate']),
  rate_cents: z.number().int().min(0),
  is_active: z.boolean().optional(),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();

export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
