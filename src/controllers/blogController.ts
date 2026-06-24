import { Request, Response, NextFunction } from 'express';
import * as blogService from '../services/blogService';
import { generateSlug } from '../utils/slug';

// Public controllers

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, parseInt((req.query.limit as string) || '10', 10));

    const result = await blogService.getPublishedPosts(page, limit);

    res.json({
      success: true,
      data: result.posts,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await blogService.getPostBySlug(String(req.params.slug));
    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// Admin controllers

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await blogService.getPostById(String(req.params.id));
    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10));

    const result = await blogService.getAllPosts(page, limit);

    res.json({
      success: true,
      data: result.posts,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as {
      title: string;
      content: string;
      slug?: string;
      excerpt?: string;
      featured_image_path?: string;
      status?: 'draft' | 'published';
      meta_title?: string;
      meta_description?: string;
      published_at?: string;
    };

    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }

    const post = await blogService.createPost({ ...data, slug: data.slug });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await blogService.updatePost(String(req.params.id), req.body);
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await blogService.deletePost(String(req.params.id));
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }
    const path = `/api/uploads/blog/${req.file.filename}`;
    res.json({ success: true, data: { path } });
  } catch (err) {
    next(err);
  }
}
