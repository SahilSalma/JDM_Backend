import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  slug: z.string().min(1).max(200).optional(), // auto-generated from title if not provided
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  category: z.enum(['engine', 'transmission', 'part']),
  price_cents: z.number().int().positive(),
  compare_at_price_cents: z.number().int().positive().optional().nullable(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  make_id: z.string().uuid().optional().nullable(),
  model_id: z.string().uuid().optional().nullable(),
  year_start: z.number().int().min(1900).max(2100).optional(),
  year_end: z.number().int().min(1900).max(2100).optional(),
  engine_code: z.string().max(50).optional(),
  displacement: z.string().max(50).optional(),
  cylinders: z.number().int().min(1).max(16).optional(),
  fuel_type: z.string().max(50).optional(),
  transmission_type: z.string().max(100).optional(),
  quantity: z.number().int().min(0).default(0),
  max_per_order: z.number().int().min(1).default(1),
  low_stock_threshold: z.number().int().min(0).default(1),
  show_when_out_of_stock: z.boolean().default(false),
  primary_image_path: z.string().optional(),
  mileage_km: z.number().int().min(0).optional().nullable(),
  condition: z.string().max(100).optional().nullable(),
  condition_notes: z.string().optional().nullable(),
  included_items: z.string().optional().nullable(),
  specs_json: z.string().optional().nullable(),
  warranty_summary: z.string().optional().nullable(),
  related_product_ids: z.string().optional().nullable(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  gtin: z.string().max(14).optional(),
  mpn: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'draft', 'archived']).transform((val) => (val === 'draft' ? 'inactive' : val)).default('active'),
  featured: z.boolean().default(false),
  compatibility: z
    .array(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        year_start: z.number().int().optional(),
        year_end: z.number().int().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
