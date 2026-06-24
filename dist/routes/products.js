"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
router.get('/', productController_1.list);
router.get('/makes', productController_1.getMakes);
router.get('/featured', productController_1.getFeatured);
router.get('/search', productController_1.search);
router.get('/models/:make', productController_1.getModels);
router.get('/years/:make/:model', productController_1.getYears);
router.get('/:slug', productController_1.getBySlug);
exports.default = router;
//# sourceMappingURL=products.js.map