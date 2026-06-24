"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1).max(100),
    slug: zod_1.z.string().min(1).max(200).optional(), // auto-generated from title if not provided
    title: zod_1.z.string().min(1).max(300),
    description: zod_1.z.string().optional(),
    short_description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.enum(['engine', 'transmission', 'part']),
    price_cents: zod_1.z.number().int().positive(),
    compare_at_price_cents: zod_1.z.number().int().positive().optional().nullable(),
    make: zod_1.z.string().max(100).optional(),
    model: zod_1.z.string().max(100).optional(),
    make_id: zod_1.z.string().uuid().optional().nullable(),
    model_id: zod_1.z.string().uuid().optional().nullable(),
    year_start: zod_1.z.number().int().min(1900).max(2100).optional(),
    year_end: zod_1.z.number().int().min(1900).max(2100).optional(),
    engine_code: zod_1.z.string().max(50).optional(),
    displacement: zod_1.z.string().max(50).optional(),
    cylinders: zod_1.z.number().int().min(1).max(16).optional(),
    fuel_type: zod_1.z.string().max(50).optional(),
    transmission_type: zod_1.z.string().max(100).optional(),
    quantity: zod_1.z.number().int().min(0).default(0),
    max_per_order: zod_1.z.number().int().min(1).default(1),
    low_stock_threshold: zod_1.z.number().int().min(0).default(1),
    show_when_out_of_stock: zod_1.z.boolean().default(false),
    primary_image_path: zod_1.z.string().optional(),
    mileage_km: zod_1.z.number().int().min(0).optional().nullable(),
    condition: zod_1.z.string().max(100).optional().nullable(),
    condition_notes: zod_1.z.string().optional().nullable(),
    included_items: zod_1.z.string().optional().nullable(),
    specs_json: zod_1.z.string().optional().nullable(),
    warranty_summary: zod_1.z.string().optional().nullable(),
    related_product_ids: zod_1.z.string().optional().nullable(),
    meta_title: zod_1.z.string().max(200).optional(),
    meta_description: zod_1.z.string().max(500).optional(),
    gtin: zod_1.z.string().max(14).optional(),
    mpn: zod_1.z.string().max(100).optional(),
    status: zod_1.z.enum(['active', 'inactive', 'draft', 'archived']).transform((val) => (val === 'draft' ? 'inactive' : val)).default('active'),
    featured: zod_1.z.boolean().default(false),
    compatibility: zod_1.z
        .array(zod_1.z.object({
        make: zod_1.z.string().min(1),
        model: zod_1.z.string().min(1),
        year_start: zod_1.z.number().int().optional(),
        year_end: zod_1.z.number().int().optional(),
        notes: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
//# sourceMappingURL=product.js.map