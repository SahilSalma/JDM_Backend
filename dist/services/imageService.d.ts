export interface ProcessedImages {
    original: string;
    large: string;
    medium: string;
    thumb: string;
    placeholder: string;
}
export declare function processImage(filePath: string): Promise<ProcessedImages>;
export declare function getPublicImagePath(absolutePath: string): string;
export interface EnrichedImage {
    id: string;
    product_id: string;
    image_path: string;
    alt_text: string | null;
    sort_order: number;
    created_at: string;
    large_path: string;
    medium_path: string;
    thumb_path: string;
}
export declare function enrichImage(img: {
    id: string;
    product_id: string;
    image_path: string;
    alt_text: string | null;
    sort_order: number;
    created_at: string;
}): EnrichedImage;
//# sourceMappingURL=imageService.d.ts.map