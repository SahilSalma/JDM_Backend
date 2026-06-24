import type { NewBlogPost } from '../models/schema';
export declare function getPublishedPosts(page?: number, limit?: number): Promise<{
    posts: {
        status: "draft" | "published";
        id: string;
        slug: string;
        created_at: string;
        updated_at: string;
        title: string;
        meta_title: string | null;
        meta_description: string | null;
        content: string;
        excerpt: string | null;
        featured_image_path: string | null;
        published_at: string | null;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getPostBySlug(slug: string): Promise<{
    status: "draft" | "published";
    id: string;
    slug: string;
    created_at: string;
    updated_at: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    content: string;
    excerpt: string | null;
    featured_image_path: string | null;
    published_at: string | null;
} | undefined>;
export declare function getPostById(id: string): Promise<{
    status: "draft" | "published";
    id: string;
    slug: string;
    created_at: string;
    updated_at: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    content: string;
    excerpt: string | null;
    featured_image_path: string | null;
    published_at: string | null;
} | undefined>;
export declare function createPost(data: Omit<NewBlogPost, 'id' | 'created_at' | 'updated_at'> & {
    slug?: string;
}): Promise<{
    status: "draft" | "published";
    id: string;
    slug: string;
    created_at: string;
    updated_at: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    content: string;
    excerpt: string | null;
    featured_image_path: string | null;
    published_at: string | null;
} | undefined>;
export declare function updatePost(id: string, data: Partial<Omit<NewBlogPost, 'id' | 'created_at'>>): Promise<{
    status: "draft" | "published";
    id: string;
    slug: string;
    created_at: string;
    updated_at: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    content: string;
    excerpt: string | null;
    featured_image_path: string | null;
    published_at: string | null;
} | undefined>;
export declare function deletePost(id: string): Promise<void>;
export declare function getAllPosts(page?: number, limit?: number): Promise<{
    posts: {
        status: "draft" | "published";
        id: string;
        slug: string;
        created_at: string;
        updated_at: string;
        title: string;
        meta_title: string | null;
        meta_description: string | null;
        content: string;
        excerpt: string | null;
        featured_image_path: string | null;
        published_at: string | null;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
//# sourceMappingURL=blogService.d.ts.map