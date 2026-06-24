import { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/reviewService';
import { createReviewSchema, checkEligibilitySchema, updateReviewSchema, setFeaturedReviewsSchema } from '../validators/review';
import { logger } from '../middleware/logger';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';

const REVIEW_IMAGE_DIR = path.resolve('uploads/reviews');

export async function checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, product_id } = checkEligibilitySchema.parse(req.body);
    const eligible = await reviewService.checkEligibility(email, product_id);
    res.json({ success: true, data: eligible });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(data);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function createWithImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const processedImages: string[] = [];

    for (const file of files) {
      const filename = path.parse(file.filename).name;
      const largeDir = path.join(REVIEW_IMAGE_DIR, 'large');
      const mediumDir = path.join(REVIEW_IMAGE_DIR, 'medium');
      const thumbDir = path.join(REVIEW_IMAGE_DIR, 'thumb');

      if (!fs.existsSync(largeDir)) fs.mkdirSync(largeDir, { recursive: true });
      if (!fs.existsSync(mediumDir)) fs.mkdirSync(mediumDir, { recursive: true });
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

      const largePath = path.join(largeDir, `${filename}.webp`);
      const mediumPath = path.join(mediumDir, `${filename}.webp`);
      const thumbPath = path.join(thumbDir, `${filename}.webp`);

      await Promise.all([
        sharp(file.path).resize(1200).webp({ quality: 85 }).toFile(largePath),
        sharp(file.path).resize(600).webp({ quality: 80 }).toFile(mediumPath),
        sharp(file.path).resize(200).webp({ quality: 75 }).toFile(thumbPath),
      ]);

      const publicPath = `/uploads/reviews/large/${filename}.webp`;
      processedImages.push(publicPath);
    }

    const bodyData = {
      ...JSON.parse(req.body.data || '{}'),
      images: processedImages,
    };

    const data = createReviewSchema.parse(bodyData);
    const review = await reviewService.createReview(data);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    var productId = String(req.params.productId);
    const sortBy = String(req.query.sortBy || 'date');
    const sortOrder = (req.query.sortOrder || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));

    const result = await reviewService.getProductReviews(productId, sortBy, sortOrder, page, limit);

    res.json({
      success: true,
      data: result.reviews,
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

export async function getHomepageReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await reviewService.getHomepageReviews();
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

export async function listReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const status = req.query.status as string | undefined;
    const product_id = req.query.product_id as string | undefined;
    const order_id = req.query.order_id as string | undefined;
    const rating_min = req.query.rating_min ? parseInt(String(req.query.rating_min), 10) : undefined;
    const rating_max = req.query.rating_max ? parseInt(String(req.query.rating_max), 10) : undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder || 'desc') as 'asc' | 'desc';

    const result = await reviewService.getAdminReviews(
      { status, product_id, order_id, rating_min, rating_max, search, sortBy, sortOrder },
      page,
      limit,
    );

    res.json({
      success: true,
      data: result.reviews,
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

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const review = await reviewService.getReviewById(String(req.params.id));
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await reviewService.deleteReview(String(req.params.id));
    logger.info({ reviewId: req.params.id }, 'Review deleted by admin');
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateReviewSchema.parse(req.body);
    const review = await reviewService.updateReview(String(req.params.id), data);
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function getManualPickList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));

    const result = await reviewService.getAdminReviews(
      { status: 'approved' },
      page,
      limit,
    );

    res.json({
      success: true,
      data: result.reviews,
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

export async function setFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids } = setFeaturedReviewsSchema.parse(req.body);
    await reviewService.setFeaturedReviews(ids);
    logger.info({ reviewIds: ids }, 'Featured reviews updated by admin');
    res.json({ success: true, message: 'Featured reviews updated' });
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const processedImages: string[] = [];

    for (const file of files) {
      const filename = path.parse(file.filename).name;
      const largeDir = path.join(REVIEW_IMAGE_DIR, 'large');
      const mediumDir = path.join(REVIEW_IMAGE_DIR, 'medium');
      const thumbDir = path.join(REVIEW_IMAGE_DIR, 'thumb');

      if (!fs.existsSync(largeDir)) fs.mkdirSync(largeDir, { recursive: true });
      if (!fs.existsSync(mediumDir)) fs.mkdirSync(mediumDir, { recursive: true });
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

      const largePath = path.join(largeDir, `${filename}.webp`);
      const mediumPath = path.join(mediumDir, `${filename}.webp`);
      const thumbPath = path.join(thumbDir, `${filename}.webp`);

      await Promise.all([
        sharp(file.path).resize(1200).webp({ quality: 85 }).toFile(largePath),
        sharp(file.path).resize(600).webp({ quality: 80 }).toFile(mediumPath),
        sharp(file.path).resize(200).webp({ quality: 75 }).toFile(thumbPath),
      ]);

      const publicPath = `/uploads/reviews/large/${filename}.webp`;
      processedImages.push(publicPath);
    }

    res.json({ success: true, data: processedImages });
  } catch (err) {
    next(err);
  }
}
