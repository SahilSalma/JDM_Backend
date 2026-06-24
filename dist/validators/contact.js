"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactFormSchema = void 0;
const zod_1 = require("zod");
exports.contactFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(200),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().regex(/^\+?\d{7,15}$/, 'Phone number must be 7-15 digits').optional().or(zod_1.z.literal('')),
    subject: zod_1.z.string().min(1, 'Subject is required').max(300),
    message: zod_1.z.string().min(1, 'Message is required').max(5000),
});
//# sourceMappingURL=contact.js.map