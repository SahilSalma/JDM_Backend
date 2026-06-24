import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { logger } from '../middleware/logger';

export interface ProcessedImages {
  original: string;
  large: string;
  medium: string;
  thumb: string;
  placeholder: string;
}

const OUTPUT_BASE = path.resolve('uploads/products');

const sizes = {
  large: 1200,
  medium: 600,
  thumb: 300,
  placeholder: 20,
};

export async function processImage(filePath: string): Promise<ProcessedImages> {
  const parsed = path.parse(filePath);
  const baseName = parsed.name;

  const dirs = {
    large: path.join(OUTPUT_BASE, 'large'),
    medium: path.join(OUTPUT_BASE, 'medium'),
    thumb: path.join(OUTPUT_BASE, 'thumb'),
    placeholder: path.join(OUTPUT_BASE, 'placeholder'),
  };

  // Ensure output directories exist
  for (const dir of Object.values(dirs)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const outputPaths: ProcessedImages = {
    original: filePath,
    large: path.join(dirs.large, `${baseName}.webp`),
    medium: path.join(dirs.medium, `${baseName}.webp`),
    thumb: path.join(dirs.thumb, `${baseName}.webp`),
    placeholder: path.join(dirs.placeholder, `${baseName}.webp`),
  };

  try {
    const imageBuffer = await sharp(filePath).toBuffer();

    await Promise.all([
      sharp(imageBuffer)
        .resize(sizes.large, sizes.large, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPaths.large),

      sharp(imageBuffer)
        .resize(sizes.medium, sizes.medium, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPaths.medium),

      sharp(imageBuffer)
        .resize(sizes.thumb, sizes.thumb, { fit: 'cover' })
        .webp({ quality: 75 })
        .toFile(outputPaths.thumb),

      sharp(imageBuffer)
        .resize(sizes.placeholder, sizes.placeholder, { fit: 'inside' })
        .blur(3)
        .webp({ quality: 20 })
        .toFile(outputPaths.placeholder),
    ]);

    logger.info({ filePath, outputPaths }, 'Image processed successfully');
    return outputPaths;
  } catch (err) {
    logger.error({ err, filePath }, 'Image processing failed');
    throw err;
  }
}

export function getPublicImagePath(absolutePath: string): string {
  const uploadsIndex = absolutePath.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    return '/' + absolutePath.slice(uploadsIndex);
  }
  return absolutePath;
}

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

export function enrichImage(img: {
  id: string;
  product_id: string;
  image_path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}): EnrichedImage {
  const parsed = path.parse(img.image_path);
  const baseName = parsed.name;

  const isOriginal = img.image_path.includes('/originals/');
  const largePath = isOriginal ? img.image_path : `/uploads/products/large/${baseName}.webp`;

  return {
    ...img,
    large_path: largePath,
    medium_path: `/uploads/products/medium/${baseName}.webp`,
    thumb_path: `/uploads/products/thumb/${baseName}.webp`,
  };
}
