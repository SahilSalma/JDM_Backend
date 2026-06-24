export interface MerchantProduct {
    id: string;
    sku: string;
    slug: string;
    title: string;
    description: string | null;
    price_cents: number;
    make: string | null;
    model: string | null;
    primary_image_path: string | null;
    gtin: string | null;
    mpn: string | null;
    google_merchant_id: string | null;
    quantity: number;
    category: string;
}
/**
 * Syncs a single product to Google Merchant Center using the Content API.
 */
export declare function syncProduct(product: MerchantProduct): Promise<void>;
/**
 * Removes a product from Google Merchant Center.
 */
export declare function deleteProductFromMerchant(productId: string): Promise<void>;
/**
 * Syncs all active, non-deleted products to Google Merchant Center.
 */
export declare function syncAllProducts(): Promise<{
    synced: number;
    errors: number;
}>;
/**
 * Generates an RSS 2.0 product feed XML.
 */
export declare function generateProductFeed(): Promise<string>;
//# sourceMappingURL=merchantService.d.ts.map