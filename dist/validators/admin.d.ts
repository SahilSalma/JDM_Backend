import { z } from 'zod';
export declare const changePasswordSchema: z.ZodObject<{
    current_password: z.ZodString;
    new_password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    current_password: string;
    new_password: string;
}, {
    current_password: string;
    new_password: string;
}>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]>>;
    admin_notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "refunded" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | undefined;
    admin_notes?: string | undefined;
}, {
    status?: "pending" | "refunded" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | undefined;
    admin_notes?: string | undefined;
}>;
export declare const updateTrackingSchema: z.ZodObject<{
    tracking_number: z.ZodString;
    carrier: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tracking_number: string;
    carrier: string;
}, {
    tracking_number: string;
    carrier: string;
}>;
export declare const updateInventorySchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    reason?: string | undefined;
}, {
    quantity: number;
    reason?: string | undefined;
}>;
export declare const updateSettingsSchema: z.ZodObject<{
    rule_key: z.ZodString;
    rule_value: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rule_key: string;
    rule_value: string;
    description?: string | undefined;
    is_active?: boolean | undefined;
}, {
    rule_key: string;
    rule_value: string;
    description?: string | undefined;
    is_active?: boolean | undefined;
}>;
export declare const sendEmailSchema: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    template_enabled: z.ZodDefault<z.ZodBoolean>;
    order_id: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filename: string;
        path?: string | undefined;
        content?: string | undefined;
    }, {
        filename: string;
        path?: string | undefined;
        content?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    subject: string;
    to: string;
    body: string;
    template_enabled: boolean;
    order_id?: string | undefined;
    attachments?: {
        filename: string;
        path?: string | undefined;
        content?: string | undefined;
    }[] | undefined;
}, {
    subject: string;
    to: string;
    body: string;
    order_id?: string | undefined;
    attachments?: {
        filename: string;
        path?: string | undefined;
        content?: string | undefined;
    }[] | undefined;
    template_enabled?: boolean | undefined;
}>;
export declare const createBlogSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    featured_image_path: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published"]>>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    published_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "published";
    title: string;
    content: string;
    slug?: string | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    excerpt?: string | undefined;
    featured_image_path?: string | undefined;
    published_at?: string | undefined;
}, {
    title: string;
    content: string;
    status?: "draft" | "published" | undefined;
    slug?: string | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    excerpt?: string | undefined;
    featured_image_path?: string | undefined;
    published_at?: string | undefined;
}>;
export declare const updateBlogSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    featured_image_path: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["draft", "published"]>>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    published_at: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | undefined;
    slug?: string | undefined;
    title?: string | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    featured_image_path?: string | undefined;
    published_at?: string | undefined;
}, {
    status?: "draft" | "published" | undefined;
    slug?: string | undefined;
    title?: string | undefined;
    meta_title?: string | undefined;
    meta_description?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    featured_image_path?: string | undefined;
    published_at?: string | undefined;
}>;
export declare const createShippingZoneSchema: z.ZodObject<{
    state_code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    city: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    zone_type: z.ZodEnum<["forklift", "no_forklift", "liftgate"]>;
    rate_cents: z.ZodNumber;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    zone_type: "forklift" | "no_forklift" | "liftgate";
    rate_cents: number;
    is_active?: boolean | undefined;
    state_code?: string | null | undefined;
    city?: string | null | undefined;
}, {
    zone_type: "forklift" | "no_forklift" | "liftgate";
    rate_cents: number;
    is_active?: boolean | undefined;
    state_code?: string | null | undefined;
    city?: string | null | undefined;
}>;
export declare const updateShippingZoneSchema: z.ZodObject<{
    state_code: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    city: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    zone_type: z.ZodOptional<z.ZodEnum<["forklift", "no_forklift", "liftgate"]>>;
    rate_cents: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    is_active?: boolean | undefined;
    state_code?: string | null | undefined;
    city?: string | null | undefined;
    zone_type?: "forklift" | "no_forklift" | "liftgate" | undefined;
    rate_cents?: number | undefined;
}, {
    is_active?: boolean | undefined;
    state_code?: string | null | undefined;
    city?: string | null | undefined;
    zone_type?: "forklift" | "no_forklift" | "liftgate" | undefined;
    rate_cents?: number | undefined;
}>;
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
//# sourceMappingURL=admin.d.ts.map