"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFeaturedReviewsSchema = exports.updateReviewSchema = exports.checkEligibilitySchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    product_id: zod_1.z.string().uuid(),
    order_id: zod_1.z.string().uuid(),
    customer_email: zod_1.z.string().email(),
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().min(1).max(5000),
    images: zod_1.z.array(zod_1.z.string()).max(5).optional(),
});
exports.checkEligibilitySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    product_id: zod_1.z.string().uuid().optional(),
});
exports.updateReviewSchema = zod_1.z.object({
    status: zod_1.z.enum(['approved', 'pending', 'rejected']).optional(),
    is_featured: zod_1.z.boolean().optional(),
});
exports.setFeaturedReviewsSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().uuid()).max(5),
});
//# sourceMappingURL=review.js.map