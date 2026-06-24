import type { Review } from '../models/schema';
export interface ReviewFilters {
    status?: string;
    product_id?: string;
    rating_min?: number;
    rating_max?: number;
    search?: string;
    order_id?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface CreateReviewData {
    product_id: string;
    order_id: string;
    customer_email: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
}
export declare function checkEligibility(email: string, productId?: string): Promise<Array<{
    product_id: string;
    product_title: string;
    product_sku: string;
    order_id: string;
    order_number: string;
    created_at: string;
}>>;
export declare function createReview(data: CreateReviewData): Promise<Review>;
export declare function getProductReviews(productId: string, sortBy?: string, sortOrder?: 'asc' | 'desc', page?: number, limit?: number): Promise<{
    reviews: {
        images: string[];
        status: "pending" | "approved" | "rejected";
        id: string;
        sort_order: number | null;
        created_at: string;
        updated_at: string;
        title: string | null;
        product_id: string;
        customer_email: string;
        order_id: string;
        content: string;
        customer_name: string;
        rating: number;
        is_featured: boolean;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getHomepageReviews(): Promise<any[]>;
export declare function getAdminReviews(filters?: ReviewFilters, page?: number, limit?: number): Promise<{
    reviews: {
        images: string[];
        product: {
            id: string;
            title: string;
            slug: string;
        } | null;
        order: {
            id: string;
            order_number: string;
        } | null;
        status: "pending" | "approved" | "rejected";
        id: string;
        sort_order: number | null;
        created_at: string;
        updated_at: string;
        title: string | null;
        product_id: string;
        customer_email: string;
        order_id: string;
        content: string;
        customer_name: string;
        rating: number;
        is_featured: boolean;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getReviewById(id: string): Promise<{
    images: string[];
    product: {
        id: string;
        title: string;
        slug: string;
    } | null;
    order: {
        id: string;
        order_number: string;
    } | null;
    status: "pending" | "approved" | "rejected";
    id: string;
    sort_order: number | null;
    created_at: string;
    updated_at: string;
    title: string | null;
    product_id: string;
    customer_email: string;
    order_id: string;
    content: string;
    customer_name: string;
    rating: number;
    is_featured: boolean;
} | null>;
export declare function deleteReview(id: string): Promise<void>;
export declare function updateReview(id: string, data: {
    status?: string;
    is_featured?: boolean;
}): Promise<Review>;
export declare function setFeaturedReviews(ids: string[]): Promise<void>;
export declare function recalculateFeatured(): Promise<void>;
export declare function getOrdersForEmail(email: string): Promise<{
    id: string;
    order_number: string;
    created_at: string;
    total_cents: number;
}[]>;
//# sourceMappingURL=reviewService.d.ts.map