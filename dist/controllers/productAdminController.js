"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.getById = getById;
exports.uploadImages = uploadImages;
exports.list = list;
exports.deleteProductImage = deleteProductImage;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const productService = __importStar(require("../services/productService"));
const imageService_1 = require("../services/imageService");
const slug_1 = require("../utils/slug");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../middleware/logger");
async function create(req, res, next) {
    try {
        const data = req.body;
        const slug = data.slug ?? (0, slug_1.generateSlug)(data.title);
        // Validate make_id / model_id existence
        if (data.make_id) {
            const makeExists = await database_1.db.select({ id: schema_1.makes.id }).from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, data.make_id)).get();
            if (!makeExists) {
                res.status(400).json({ success: false, error: 'Referenced make not found' });
                return;
            }
        }
        if (data.model_id) {
            const modelExists = await database_1.db.select({ id: schema_1.models.id }).from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, data.model_id)).get();
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
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const data = req.body;
        if (data.make_id) {
            const makeExists = await database_1.db.select({ id: schema_1.makes.id }).from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, data.make_id)).get();
            if (!makeExists) {
                res.status(400).json({ success: false, error: 'Referenced make not found' });
                return;
            }
        }
        if (data.model_id) {
            const modelExists = await database_1.db.select({ id: schema_1.models.id }).from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, data.model_id)).get();
            if (!modelExists) {
                res.status(400).json({ success: false, error: 'Referenced model not found' });
                return;
            }
        }
        const product = await productService.updateProduct(String(req.params.id), data);
        res.json({ success: true, data: product });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        await productService.deleteProduct(String(req.params.id));
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function getById(req, res, next) {
    try {
        const product = await productService.getProductById(String(req.params.id));
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.json({ success: true, data: product });
    }
    catch (err) {
        next(err);
    }
}
async function uploadImages(req, res, next) {
    try {
        const files = req.files;
        const productId = String(req.params.id);
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, error: 'No images uploaded' });
            return;
        }
        const product = await productService.getProductById(productId);
        if (!product) {
            // Clean up uploaded files
            for (const file of files) {
                fs_1.default.unlinkSync(file.path);
            }
            throw (0, errorHandler_1.createError)('Product not found', 404);
        }
        const processedImages = await Promise.all(files.map(async (file, index) => {
            const processed = await (0, imageService_1.processImage)(file.path);
            const imageId = crypto.randomUUID();
            const imagePath = (0, imageService_1.getPublicImagePath)(processed.original);
            const imageRecord = {
                id: imageId,
                product_id: productId,
                image_path: imagePath,
                alt_text: `${product.title} - Image ${index + 1}`,
                sort_order: index,
                created_at: new Date().toISOString(),
            };
            await database_1.db.insert(schema_1.productImages).values(imageRecord);
            return {
                id: imageId,
                original: (0, imageService_1.getPublicImagePath)(processed.original),
                large: (0, imageService_1.getPublicImagePath)(processed.large),
                medium: (0, imageService_1.getPublicImagePath)(processed.medium),
                thumb: (0, imageService_1.getPublicImagePath)(processed.thumb),
                placeholder: (0, imageService_1.getPublicImagePath)(processed.placeholder),
            };
        }));
        // Set first image as primary if product has none
        if (!product.primary_image_path && processedImages.length > 0) {
            await productService.updateProduct(productId, {
                primary_image_path: processedImages[0].original,
            });
        }
        res.json({ success: true, data: processedImages });
    }
    catch (err) {
        next(err);
    }
}
async function list(req, res, next) {
    try {
        const { category, make, model, status, featured, search, page, limit, sortBy, sortOrder, stock_status, ids } = req.query;
        const filters = {};
        if (category)
            filters.category = String(category);
        if (make)
            filters.make = String(make);
        if (model)
            filters.model = String(model);
        if (featured !== undefined)
            filters.featured = featured === 'true';
        if (search)
            filters.search = String(search);
        if (sortBy)
            filters.sortBy = String(sortBy);
        if (sortOrder)
            filters.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
        if (stock_status)
            filters.stock_status = String(stock_status);
        if (ids)
            filters.ids = String(ids);
        const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));
        // For admin, include all statuses unless filtered
        const result = await productService.getProducts({ ...filters, status: status ? String(status) : 'all' }, pageNum, limitNum);
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
    }
    catch (err) {
        next(err);
    }
}
async function deleteProductImage(req, res, next) {
    try {
        const productId = String(req.params.id);
        const imageId = String(req.params.imageId);
        // Find the image record
        const image = await database_1.db
            .select()
            .from(schema_1.productImages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.productImages.id, imageId), (0, drizzle_orm_1.eq)(schema_1.productImages.product_id, productId)))
            .get();
        if (!image) {
            res.status(404).json({ success: false, error: 'Image not found' });
            return;
        }
        // Delete database record
        await database_1.db
            .delete(schema_1.productImages)
            .where((0, drizzle_orm_1.eq)(schema_1.productImages.id, imageId));
        // If this was the primary image for the product, update primary_image_path
        const product = await productService.getProductById(productId);
        if (product && product.primary_image_path === image.image_path) {
            const remainingImages = await database_1.db
                .select()
                .from(schema_1.productImages)
                .where((0, drizzle_orm_1.eq)(schema_1.productImages.product_id, productId))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.productImages.sort_order))
                .limit(1);
            const newPrimary = remainingImages.length > 0 ? remainingImages[0].image_path : null;
            await productService.updateProduct(productId, {
                primary_image_path: newPrimary,
            });
        }
        // Delete files from disk
        const relativePath = image.image_path.startsWith('/') ? image.image_path.slice(1) : image.image_path;
        const originalFullPath = path_1.default.resolve(relativePath);
        const parsed = path_1.default.parse(originalFullPath);
        const baseName = parsed.name;
        const sizesDirs = ['large', 'medium', 'thumb', 'placeholder'];
        for (const size of sizesDirs) {
            const sizeFilePath = path_1.default.resolve('uploads/products', size, `${baseName}.webp`);
            if (fs_1.default.existsSync(sizeFilePath)) {
                try {
                    fs_1.default.unlinkSync(sizeFilePath);
                }
                catch (err) {
                    logger_1.logger.error({ err, path: sizeFilePath }, 'Failed to delete resized image file');
                }
            }
        }
        if (fs_1.default.existsSync(originalFullPath)) {
            try {
                fs_1.default.unlinkSync(originalFullPath);
            }
            catch (err) {
                logger_1.logger.error({ err, path: originalFullPath }, 'Failed to delete original image file');
            }
        }
        res.json({ success: true, message: 'Image deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=productAdminController.js.map