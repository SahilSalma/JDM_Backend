import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';
import { searchService } from '../services/searchService';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, make, model, year, status, featured, search, min_price, max_price, transmission_type, inStock, ids, page, limit } = req.query;

    const filters: productService.ProductFilters = {};
    if (category) filters.category = String(category);
    if (make) filters.make = String(make);
    if (model) filters.model = String(model);
    if (year) filters.year = parseInt(String(year), 10);
    if (status) filters.status = String(status);
    if (featured !== undefined) filters.featured = featured === 'true';
    if (search) filters.search = String(search);
    if (min_price) filters.min_price = parseInt(String(min_price), 10);
    if (max_price) filters.max_price = parseInt(String(max_price), 10);
    if (transmission_type) filters.transmission_type = String(transmission_type);
    if (inStock === 'true') filters.inStock = true;
    if (ids) filters.ids = String(ids);

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));

    const result = await productService.getProducts(filters, pageNum, limitNum);

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

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getProductBySlug(String(req.params.slug));
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function getMakes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const makes = await productService.getMakes();
    res.json({ success: true, data: makes });
  } catch (err) {
    next(err);
  }
}

export async function getModels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const make = String(req.params.make);
    const models = await productService.getModelsByMake(make);
    res.json({ success: true, data: models });
  } catch (err) {
    next(err);
  }
}

export async function getYears(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const make = String(req.params.make);
    const model = String(req.params.model);
    const years = await productService.getYearsByMakeModel(make, model);
    res.json({ success: true, data: years });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = String(req.query.q || '');
    const limit = Math.min(50, parseInt(String(req.query.limit || '20'), 10));

    if (!q.trim()) {
      res.json({ success: true, data: [] });
      return;
    }

    const results = await searchService.searchProducts(q, limit);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function getFeatured(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await productService.getFeaturedProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}
