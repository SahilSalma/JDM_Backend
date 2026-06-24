import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../config/database';
import { productImages, makes, models } from '../models/schema';
import type { NewProductImage } from '../models/schema';
import { eq, and, asc } from 'drizzle-orm';
import * as productService from '../services/productService';
import { processImage, getPublicImagePath } from '../services/imageService';
import { generateSlug } from '../utils/slug';
import { createError } from '../middleware/errorHandler';
import type { CreateProductInput } from '../validators/product';
import { logger } from '../middleware/logger';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as CreateProductInput;
    const slug = data.slug ?? generateSlug(data.title);

    // Validate make_id / model_id existence
    if (data.make_id) {
      const makeExists = await db.select({ id: makes.id }).from(makes).where(eq(makes.id, data.make_id)).get();
      if (!makeExists) {
        res.status(400).json({ success: false, error: 'Referenced make not found' });
        return;
      }
    }
    if (data.model_id) {
      const modelExists = await db.select({ id: models.id }).from(models).where(eq(models.id, data.model_id)).get();
      if (!modelExists) {
        res.status(400).json({ success: false, error: 'Referenced model not found' });
        return;
      }
    }

    const product = await productService.createProduct({
      ...data,
      slug,
      show_when_out_of_stock: data.show_when_out_of_stock ?? false,
      featured: data.featured ?? false,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as Partial<CreateProductInput>;

    if (data.make_id) {
      const makeExists = await db.select({ id: makes.id }).from(makes).where(eq(makes.id, data.make_id)).get();
      if (!makeExists) {
        res.status(400).json({ success: false, error: 'Referenced make not found' });
        return;
      }
    }
    if (data.model_id) {
      const modelExists = await db.select({ id: models.id }).from(models).where(eq(models.id, data.model_id)).get();
      if (!modelExists) {
        res.status(400).json({ success: false, error: 'Referenced model not found' });
        return;
      }
    }

    const product = await productService.updateProduct(String(req.params.id), data);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.deleteProduct(String(req.params.id));
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getProductById(String(req.params.id));
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    const productId = String(req.params.id);

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No images uploaded' });
      return;
    }

    const product = await productService.getProductById(productId);
    if (!product) {
      // Clean up uploaded files
      for (const file of files) {
        fs.unlinkSync(file.path);
      }
      throw createError('Product not found', 404);
    }

    const processedImages = await Promise.all(
      files.map(async (file, index) => {
        const processed = await processImage(file.path);

        const imageId = crypto.randomUUID();
        const imagePath = getPublicImagePath(processed.original);

        const imageRecord: NewProductImage = {
          id: imageId,
          product_id: productId,
          image_path: imagePath,
          alt_text: `${product.title} - Image ${index + 1}`,
          sort_order: index,
          created_at: new Date().toISOString(),
        };

        await db.insert(productImages).values(imageRecord);

        return {
          id: imageId,
          original: getPublicImagePath(processed.original),
          large: getPublicImagePath(processed.large),
          medium: getPublicImagePath(processed.medium),
          thumb: getPublicImagePath(processed.thumb),
          placeholder: getPublicImagePath(processed.placeholder),
        };
      }),
    );

    // Set first image as primary if product has none
    if (!product.primary_image_path && processedImages.length > 0) {
      await productService.updateProduct(productId, {
        primary_image_path: processedImages[0].original,
      });
    }

    res.json({ success: true, data: processedImages });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, make, model, status, featured, search, page, limit, sortBy, sortOrder, stock_status, ids } = req.query;

    const filters: productService.ProductFilters = {};
    if (category) filters.category = String(category);
    if (make) filters.make = String(make);
    if (model) filters.model = String(model);
    if (featured !== undefined) filters.featured = featured === 'true';
    if (search) filters.search = String(search);
    if (sortBy) filters.sortBy = String(sortBy);
    if (sortOrder) filters.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    if (stock_status) filters.stock_status = String(stock_status);
    if (ids) filters.ids = String(ids);

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));

    // For admin, include all statuses unless filtered
    const result = await productService.getProducts(
      { ...filters, status: status ? String(status) : 'all' },
      pageNum,
      limitNum,
    );

    res.json({
      success: true,
      data: result.products,
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

export async function deleteProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = String(req.params.id);
    const imageId = String(req.params.imageId);

    // Find the image record
    const image = await db
      .select()
      .from(productImages)
      .where(and(eq(productImages.id, imageId), eq(productImages.product_id, productId)))
      .get();

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    // Delete database record
    await db
      .delete(productImages)
      .where(eq(productImages.id, imageId));

    // If this was the primary image for the product, update primary_image_path
    const product = await productService.getProductById(productId);
    if (product && product.primary_image_path === image.image_path) {
      const remainingImages = await db
        .select()
        .from(productImages)
        .where(eq(productImages.product_id, productId))
        .orderBy(asc(productImages.sort_order))
        .limit(1);

      const newPrimary = remainingImages.length > 0 ? remainingImages[0].image_path : null;
      await productService.updateProduct(productId, {
        primary_image_path: newPrimary,
      });
    }

    // Delete files from disk
    const relativePath = image.image_path.startsWith('/') ? image.image_path.slice(1) : image.image_path;
    const originalFullPath = path.resolve(relativePath);
    const parsed = path.parse(originalFullPath);
    const baseName = parsed.name;

    const sizesDirs = ['large', 'medium', 'thumb', 'placeholder'];
    for (const size of sizesDirs) {
      const sizeFilePath = path.resolve('uploads/products', size, `${baseName}.webp`);
      if (fs.existsSync(sizeFilePath)) {
        try {
          fs.unlinkSync(sizeFilePath);
        } catch (err) {
          logger.error({ err, path: sizeFilePath }, 'Failed to delete resized image file');
        }
      }
    }

    if (fs.existsSync(originalFullPath)) {
      try {
        fs.unlinkSync(originalFullPath);
      } catch (err) {
        logger.error({ err, path: originalFullPath }, 'Failed to delete original image file');
      }
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    next(err);
  }
}
