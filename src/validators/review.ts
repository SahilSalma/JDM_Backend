import { z } from 'zod';

export const createReviewSchema = z.object({
  product_id: z.string().uuid(),
  order_id: z.string().uuid(),
  customer_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(5000),
  images: z.array(z.string()).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const checkEligibilitySchema = z.object({
  email: z.string().email(),
  product_id: z.string().uuid().optional(),
});

export type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>;

export const updateReviewSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']).optional(),
  is_featured: z.boolean().optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const setFeaturedReviewsSchema = z.object({
  ids: z.array(z.string().uuid()).max(5),
});

export type SetFeaturedReviewsInput = z.infer<typeof setFeaturedReviewsSchema>;
