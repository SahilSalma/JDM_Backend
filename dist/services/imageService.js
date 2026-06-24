"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = processImage;
exports.getPublicImagePath = getPublicImagePath;
exports.enrichImage = enrichImage;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../middleware/logger");
const OUTPUT_BASE = path_1.default.resolve('uploads/products');
const sizes = {
    large: 1200,
    medium: 600,
    thumb: 300,
    placeholder: 20,
};
async function processImage(filePath) {
    const parsed = path_1.default.parse(filePath);
    const baseName = parsed.name;
    const dirs = {
        large: path_1.default.join(OUTPUT_BASE, 'large'),
        medium: path_1.default.join(OUTPUT_BASE, 'medium'),
        thumb: path_1.default.join(OUTPUT_BASE, 'thumb'),
        placeholder: path_1.default.join(OUTPUT_BASE, 'placeholder'),
    };
    // Ensure output directories exist
    for (const dir of Object.values(dirs)) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    const outputPaths = {
        original: filePath,
        large: path_1.default.join(dirs.large, `${baseName}.webp`),
        medium: path_1.default.join(dirs.medium, `${baseName}.webp`),
        thumb: path_1.default.join(dirs.thumb, `${baseName}.webp`),
        placeholder: path_1.default.join(dirs.placeholder, `${baseName}.webp`),
    };
    try {
        const imageBuffer = await (0, sharp_1.default)(filePath).toBuffer();
        await Promise.all([
            (0, sharp_1.default)(imageBuffer)
                .resize(sizes.large, sizes.large, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toFile(outputPaths.large),
            (0, sharp_1.default)(imageBuffer)
                .resize(sizes.medium, sizes.medium, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(outputPaths.medium),
            (0, sharp_1.default)(imageBuffer)
                .resize(sizes.thumb, sizes.thumb, { fit: 'cover' })
                .webp({ quality: 75 })
                .toFile(outputPaths.thumb),
            (0, sharp_1.default)(imageBuffer)
                .resize(sizes.placeholder, sizes.placeholder, { fit: 'inside' })
                .blur(3)
                .webp({ quality: 20 })
                .toFile(outputPaths.placeholder),
        ]);
        logger_1.logger.info({ filePath, outputPaths }, 'Image processed successfully');
        return outputPaths;
    }
    catch (err) {
        logger_1.logger.error({ err, filePath }, 'Image processing failed');
        throw err;
    }
}
function getPublicImagePath(absolutePath) {
    const uploadsIndex = absolutePath.indexOf('uploads/');
    if (uploadsIndex !== -1) {
        return '/' + absolutePath.slice(uploadsIndex);
    }
    return absolutePath;
}
function enrichImage(img) {
    const parsed = path_1.default.parse(img.image_path);
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
//# sourceMappingURL=imageService.js.map