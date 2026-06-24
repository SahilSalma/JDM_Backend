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
exports.getById = getById;
exports.adminList = adminList;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.uploadImage = uploadImage;
const blogService = __importStar(require("../services/blogService"));
const slug_1 = require("../utils/slug");
// Public controllers
async function list(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
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
    }
    catch (err) {
        next(err);
    }
}
async function getBySlug(req, res, next) {
    try {
        const post = await blogService.getPostBySlug(String(req.params.slug));
        if (!post) {
            res.status(404).json({ success: false, error: 'Blog post not found' });
            return;
        }
        res.json({ success: true, data: post });
    }
    catch (err) {
        next(err);
    }
}
// Admin controllers
async function getById(req, res, next) {
    try {
        const post = await blogService.getPostById(String(req.params.id));
        if (!post) {
            res.status(404).json({ success: false, error: 'Blog post not found' });
            return;
        }
        res.json({ success: true, data: post });
    }
    catch (err) {
        next(err);
    }
}
async function adminList(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
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
    }
    catch (err) {
        next(err);
    }
}
async function create(req, res, next) {
    try {
        const data = req.body;
        if (!data.slug) {
            data.slug = (0, slug_1.generateSlug)(data.title);
        }
        const post = await blogService.createPost({ ...data, slug: data.slug });
        res.status(201).json({ success: true, data: post });
    }
    catch (err) {
        next(err);
    }
}
async function update(req, res, next) {
    try {
        const post = await blogService.updatePost(String(req.params.id), req.body);
        res.json({ success: true, data: post });
    }
    catch (err) {
        next(err);
    }
}
async function remove(req, res, next) {
    try {
        await blogService.deletePost(String(req.params.id));
        res.json({ success: true, message: 'Blog post deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function uploadImage(req, res, next) {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No image file provided' });
            return;
        }
        const path = `/api/uploads/blog/${req.file.filename}`;
        res.json({ success: true, data: { path } });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=blogController.js.map