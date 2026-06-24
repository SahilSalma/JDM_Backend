"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShippingZoneSchema = exports.createShippingZoneSchema = exports.updateBlogSchema = exports.createBlogSchema = exports.sendEmailSchema = exports.updateSettingsSchema = exports.updateInventorySchema = exports.updateTrackingSchema = exports.updateOrderStatusSchema = exports.loginSchema = exports.changePasswordSchema = void 0;
const zod_1 = require("zod");
exports.changePasswordSchema = zod_1.z.object({
    current_password: zod_1.z.string().min(1, 'Current password is required'),
    new_password: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
    ]).optional(),
    admin_notes: zod_1.z.string().optional(),
});
exports.updateTrackingSchema = zod_1.z.object({
    tracking_number: zod_1.z.string().min(1, 'Tracking number is required'),
    carrier: zod_1.z.string().min(1, 'Carrier is required'),
});
exports.updateInventorySchema = zod_1.z.object({
    quantity: zod_1.z.number().int().min(0, 'Quantity cannot be negative'),
    reason: zod_1.z.string().optional(),
});
exports.updateSettingsSchema = zod_1.z.object({
    rule_key: zod_1.z.string().min(1),
    rule_value: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.sendEmailSchema = zod_1.z.object({
    to: zod_1.z.string().email('Invalid recipient email'),
    subject: zod_1.z.string().min(1, 'Subject is required'),
    body: zod_1.z.string().min(1, 'Email body is required'),
    template_enabled: zod_1.z.boolean().default(false),
    order_id: zod_1.z.string().uuid().optional(),
    attachments: zod_1.z
        .array(zod_1.z.object({
        filename: zod_1.z.string(),
        path: zod_1.z.string().optional(),
        content: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.createBlogSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).max(200).optional(),
    title: zod_1.z.string().min(1).max(300),
    content: zod_1.z.string().min(1),
    excerpt: zod_1.z.string().max(500).optional(),
    featured_image_path: zod_1.z.string().optional(),
    status: zod_1.z.enum(['draft', 'published']).default('draft'),
    meta_title: zod_1.z.string().max(200).optional(),
    meta_description: zod_1.z.string().max(500).optional(),
    published_at: zod_1.z.string().datetime().optional(),
});
exports.updateBlogSchema = exports.createBlogSchema.partial();
exports.createShippingZoneSchema = zod_1.z.object({
    state_code: zod_1.z.string().length(2).optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    zone_type: zod_1.z.enum(['forklift', 'no_forklift', 'liftgate']),
    rate_cents: zod_1.z.number().int().min(0),
    is_active: zod_1.z.boolean().optional(),
});
exports.updateShippingZoneSchema = exports.createShippingZoneSchema.partial();
//# sourceMappingURL=admin.js.map