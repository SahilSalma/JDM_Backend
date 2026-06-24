"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBlogImage = exports.uploadImages = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = path_1.default.resolve('uploads/products/originals');
const BLOG_UPLOAD_DIR = path_1.default.resolve('uploads/blog');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs_1.default.existsSync(BLOG_UPLOAD_DIR)) {
    fs_1.default.mkdirSync(BLOG_UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${ext}`);
    },
});
function fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
}
exports.uploadImages = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
        files: 10,
    },
});
const blogStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, BLOG_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `blog-${uniqueSuffix}${ext}`);
    },
});
exports.uploadBlogImage = (0, multer_1.default)({
    storage: blogStorage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
});
//# sourceMappingURL=upload.js.map