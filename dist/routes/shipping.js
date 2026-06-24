"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shippingController_1 = require("../controllers/shippingController");
const router = (0, express_1.Router)();
// Get all rates (optionally for a specific state)
router.get('/rates', shippingController_1.getAllRates);
// Get rate for a specific type + state
router.get('/rate', shippingController_1.getRate);
exports.default = router;
//# sourceMappingURL=shipping.js.map