"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_1 = require("../validators/contact");
const emailService_1 = require("../services/emailService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.post('/', async (req, res, next) => {
    try {
        const data = contact_1.contactFormSchema.parse(req.body);
        await (0, emailService_1.sendContactEmails)(data.name, data.email, data.phone, data.subject, data.message);
        res.status(200).json({
            success: true,
            message: 'Message received. We will get back to you shortly.',
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
            return;
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=contact.js.map