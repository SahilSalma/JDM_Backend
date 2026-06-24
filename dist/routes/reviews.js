"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const uploadReviewImages_1 = require("../middleware/uploadReviewImages");
const router = (0, express_1.Router)();
router.post('/check-eligibility', reviewController_1.checkEligibility);
router.post('/', uploadReviewImages_1.uploadReviewImages.array('images', 5), reviewController_1.createWithImages);
router.get('/product/:productId', reviewController_1.getProductReviews);
router.get('/homepage', reviewController_1.getHomepageReviews);
exports.default = router;
//# sourceMappingURL=reviews.js.map