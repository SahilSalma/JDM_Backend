import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    product_id: z.ZodString;
    order_id: z.ZodString;
    customer_email: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    product_id: string;
    customer_email: string;
    order_id: string;
    content: string;
    rating: number;
    title?: string | undefined;
    images?: string[] | undefined;
}, {
    product_id: string;
    customer_email: string;
    order_id: string;
    content: string;
    rating: number;
    title?: string | undefined;
    images?: string[] | undefined;
}>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export declare const checkEligibilitySchema: z.ZodObject<{
    email: z.ZodString;
    product_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    product_id?: string | undefined;
}, {
    email: string;
    product_id?: string | undefined;
}>;
export type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>;
export declare const updateReviewSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["approved", "pending", "rejected"]>>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "approved" | "rejected" | undefined;
    is_featured?: boolean | undefined;
}, {
    status?: "pending" | "approved" | "rejected" | undefined;
    is_featured?: boolean | undefined;
}>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export declare const setFeaturedReviewsSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids: string[];
}, {
    ids: string[];
}>;
export type SetFeaturedReviewsInput = z.infer<typeof setFeaturedReviewsSchema>;
//# sourceMappingURL=review.d.ts.map