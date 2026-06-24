export interface SearchResult {
    id: string;
    sku: string;
    slug: string;
    title: string;
    price_cents: number;
    primary_image_path: string | null;
    make: string | null;
    model: string | null;
    category: string;
    rank?: number;
}
declare function indexProduct(productId: string): Promise<void>;
declare function searchProducts(query: string, limit?: number): Promise<SearchResult[]>;
export declare const searchService: {
    indexProduct: typeof indexProduct;
    searchProducts: typeof searchProducts;
};
export {};
//# sourceMappingURL=searchService.d.ts.map