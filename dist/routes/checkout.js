"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkoutController_1 = require("../controllers/checkoutController");
const validate_1 = require("../middleware/validate");
const checkout_1 = require("../validators/checkout");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
router.post('/confirm', rateLimit_1.checkoutRateLimit, (0, validate_1.validate)(checkout_1.confirmOrderSchema), checkoutController_1.confirmOrder);
exports.default = router;
//# sourceMappingURL=checkout.js.map