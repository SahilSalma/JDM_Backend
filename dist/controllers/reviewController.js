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
exports.checkEligibility = checkEligibility;
exports.create = create;
exports.createWithImages = createWithImages;
exports.getProductReviews = getProductReviews;
exports.getHomepageReviews = getHomepageReviews;
exports.listReviews = listReviews;
exports.getById = getById;
exports.remove = remove;
exports.update = update;
exports.getManualPickList = getManualPickList;
exports.setFeatured = setFeatured;
exports.uploadImages = uploadImages;
const reviewService = __importStar(require("../services/reviewService"));
const review_1 = require("../validators/review");
const logger_1 = require("../middleware/logger");
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const REVIEW_IMAGE_DIR = path_1.default.resolve('uploads/reviews');
async function checkEligibility(req, res, next) {
    try {
        const { email, product_id } = review_1.checkEligibilitySchema.parse(req.body);
        const eligible = await reviewService.checkEligibility(email, product_id);
        res.json({ success: true, data: eligible });
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const data = review_1.createReviewSchema.parse(req.body);
        const review = await reviewService.createReview(data);
        res.status(201).json({ success: true, data: review });
    }
    catch (err) {
        next(err);
    }
}
async function createWithImages(req, res, next) {
    try {
        const files = req.files || [];
        const processedImages = [];
        for (const file of files) {
            const filename = path_1.default.parse(file.filename).name;
            const largeDir = path_1.default.join(REVIEW_IMAGE_DIR, 'large');
            const mediumDir = path_1.default.join(REVIEW_IMAGE_DIR, 'medium');
            const thumbDir = path_1.default.join(REVIEW_IMAGE_DIR, 'thumb');
            if (!fs_1.default.existsSync(largeDir))
                fs_1.default.mkdirSync(largeDir, { recursive: true });
            if (!fs_1.default.existsSync(mediumDir))
                fs_1.default.mkdirSync(mediumDir, { recursive: true });
            if (!fs_1.default.existsSync(thumbDir))
                fs_1.default.mkdirSync(thumbDir, { recursive: true });
            const largePath = path_1.default.join(largeDir, `${filename}.webp`);
            const mediumPath = path_1.default.join(mediumDir, `${filename}.webp`);
            const thumbPath = path_1.default.join(thumbDir, `${filename}.webp`);
            await Promise.all([
                (0, sharp_1.default)(file.path).resize(1200).webp({ quality: 85 }).toFile(largePath),
                (0, sharp_1.default)(file.path).resize(600).webp({ quality: 80 }).toFile(mediumPath),
                (0, sharp_1.default)(file.path).resize(200).webp({ quality: 75 }).toFile(thumbPath),
            ]);
            const publicPath = `/uploads/reviews/large/${filename}.webp`;
            processedImages.push(publicPath);
        }
        const bodyData = {
            ...JSON.parse(req.body.data || '{}'),
            images: processedImages,
        };
        const data = review_1.createReviewSchema.parse(bodyData);
        const review = await reviewService.createReview(data);
        res.status(201).json({ success: true, data: review });
    }
    catch (err) {
        next(err);
    }
}
async function getProductReviews(req, res, next) {
    try {
        var productId = String(req.params.productId);
        const sortBy = String(req.query.sortBy || 'date');
        const sortOrder = (req.query.sortOrder || 'desc');
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
    }
    catch (err) {
        next(err);
    }
}
async function getHomepageReviews(req, res, next) {
    try {
        const reviews = await reviewService.getHomepageReviews();
        res.json({ success: true, data: reviews });
    }
    catch (err) {
        next(err);
    }
}
async function listReviews(req, res, next) {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
        const status = req.query.status;
        const product_id = req.query.product_id;
        const order_id = req.query.order_id;
        const rating_min = req.query.rating_min ? parseInt(String(req.query.rating_min), 10) : undefined;
        const rating_max = req.query.rating_max ? parseInt(String(req.query.rating_max), 10) : undefined;
        const search = req.query.search;
        const sortBy = req.query.sortBy;
        const sortOrder = (req.query.sortOrder || 'desc');
        const result = await reviewService.getAdminReviews({ status, product_id, order_id, rating_min, rating_max, search, sortBy, sortOrder }, page, limit);
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
    }
    catch (err) {
        next(err);
    }
}
async function getById(req, res, next) {
    try {
        const review = await reviewService.getReviewById(String(req.params.id));
        if (!review) {
            res.status(404).json({ success: false, error: 'Review not found' });
            return;
        }
        res.json({ success: true, data: review });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        await reviewService.deleteReview(String(req.params.id));
        logger_1.logger.info({ reviewId: req.params.id }, 'Review deleted by admin');
        res.json({ success: true, message: 'Review deleted' });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const data = review_1.updateReviewSchema.parse(req.body);
        const review = await reviewService.updateReview(String(req.params.id), data);
        res.json({ success: true, data: review });
    }
    catch (err) {
        next(err);
    }
}
async function getManualPickList(req, res, next) {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
        const result = await reviewService.getAdminReviews({ status: 'approved' }, page, limit);
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
    }
    catch (err) {
        next(err);
    }
}
async function setFeatured(req, res, next) {
    try {
        const { ids } = review_1.setFeaturedReviewsSchema.parse(req.body);
        await reviewService.setFeaturedReviews(ids);
        logger_1.logger.info({ reviewIds: ids }, 'Featured reviews updated by admin');
        res.json({ success: true, message: 'Featured reviews updated' });
    }
    catch (err) {
        next(err);
    }
}
async function uploadImages(req, res, next) {
    try {
        const files = req.files || [];
        const processedImages = [];
        for (const file of files) {
            const filename = path_1.default.parse(file.filename).name;
            const largeDir = path_1.default.join(REVIEW_IMAGE_DIR, 'large');
            const mediumDir = path_1.default.join(REVIEW_IMAGE_DIR, 'medium');
            const thumbDir = path_1.default.join(REVIEW_IMAGE_DIR, 'thumb');
            if (!fs_1.default.existsSync(largeDir))
                fs_1.default.mkdirSync(largeDir, { recursive: true });
            if (!fs_1.default.existsSync(mediumDir))
                fs_1.default.mkdirSync(mediumDir, { recursive: true });
            if (!fs_1.default.existsSync(thumbDir))
                fs_1.default.mkdirSync(thumbDir, { recursive: true });
            const largePath = path_1.default.join(largeDir, `${filename}.webp`);
            const mediumPath = path_1.default.join(mediumDir, `${filename}.webp`);
            const thumbPath = path_1.default.join(thumbDir, `${filename}.webp`);
            await Promise.all([
                (0, sharp_1.default)(file.path).resize(1200).webp({ quality: 85 }).toFile(largePath),
                (0, sharp_1.default)(file.path).resize(600).webp({ quality: 80 }).toFile(mediumPath),
                (0, sharp_1.default)(file.path).resize(200).webp({ quality: 75 }).toFile(thumbPath),
            ]);
            const publicPath = `/uploads/reviews/large/${filename}.webp`;
            processedImages.push(publicPath);
        }
        res.json({ success: true, data: processedImages });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=reviewController.js.map