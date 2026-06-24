"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Stripe webhook deprecated — return 200 OK for backward compatibility
router.post('/stripe', (req, res) => {
    res.json({ received: true, message: 'Webhook deprecated. Stripe has been replaced with Authorize.net.' });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map