"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const router = (0, express_1.Router)();
router.post('/subscribe', customerController_1.subscribeNewsletter);
exports.default = router;
//# sourceMappingURL=newsletter.js.map