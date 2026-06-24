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
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.getBySlug = getBySlug;
exports.getMakes = getMakes;
exports.getModels = getModels;
exports.getYears = getYears;
exports.search = search;
exports.getFeatured = getFeatured;
const productService = __importStar(require("../services/productService"));
const searchService_1 = require("../services/searchService");
async function list(req, res, next) {
    try {
        const { category, make, model, year, status, featured, search, min_price, max_price, transmission_type, inStock, ids, page, limit } = req.query;
        const filters = {};
        if (category)
            filters.category = String(category);
        if (make)
            filters.make = String(make);
        if (model)
            filters.model = String(model);
        if (year)
            filters.year = parseInt(String(year), 10);
        if (status)
            filters.status = String(status);
        if (featured !== undefined)
            filters.featured = featured === 'true';
        if (search)
            filters.search = String(search);
        if (min_price)
            filters.min_price = parseInt(String(min_price), 10);
        if (max_price)
            filters.max_price = parseInt(String(max_price), 10);
        if (transmission_type)
            filters.transmission_type = String(transmission_type);
        if (inStock === 'true')
            filters.inStock = true;
        if (ids)
            filters.ids = String(ids);
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
    }
    catch (err) {
        next(err);
    }
}
async function getBySlug(req, res, next) {
    try {
        const product = await productService.getProductBySlug(String(req.params.slug));
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
async function getMakes(req, res, next) {
    try {
        const makes = await productService.getMakes();
        res.json({ success: true, data: makes });
    }
    catch (err) {
        next(err);
    }
}
async function getModels(req, res, next) {
    try {
        const make = String(req.params.make);
        const models = await productService.getModelsByMake(make);
        res.json({ success: true, data: models });
    }
    catch (err) {
        next(err);
    }
}
async function getYears(req, res, next) {
    try {
        const make = String(req.params.make);
        const model = String(req.params.model);
        const years = await productService.getYearsByMakeModel(make, model);
        res.json({ success: true, data: years });
    }
    catch (err) {
        next(err);
    }
}
async function search(req, res, next) {
    try {
        const q = String(req.query.q || '');
        const limit = Math.min(50, parseInt(String(req.query.limit || '20'), 10));
        if (!q.trim()) {
            res.json({ success: true, data: [] });
            return;
        }
        const results = await searchService_1.searchService.searchProducts(q, limit);
        res.json({ success: true, data: results });
    }
    catch (err) {
        next(err);
    }
}
async function getFeatured(req, res, next) {
    try {
        const products = await productService.getFeaturedProducts();
        res.json({ success: true, data: products });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=productController.js.map