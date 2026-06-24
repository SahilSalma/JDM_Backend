"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailTemplatesController = getEmailTemplatesController;
exports.getEmailTemplateById = getEmailTemplateById;
exports.createEmailTemplate = createEmailTemplate;
exports.updateEmailTemplate = updateEmailTemplate;
exports.deleteEmailTemplate = deleteEmailTemplate;
exports.getOrderNotificationRecipients = getOrderNotificationRecipients;
exports.createOrderNotificationRecipient = createOrderNotificationRecipient;
exports.updateOrderNotificationRecipient = updateOrderNotificationRecipient;
exports.deleteOrderNotificationRecipient = deleteOrderNotificationRecipient;
exports.getSubscriptions = getSubscriptions;
exports.deleteSubscription = deleteSubscription;
exports.getNavbarSettings = getNavbarSettings;
exports.updateNavbarSettings = updateNavbarSettings;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const settingsService_1 = require("../services/settingsService");
// Email Templates
async function getEmailTemplatesController(req, res, next) {
    try {
        const templates = await database_1.db.select().from(schema_1.emailTemplates).orderBy(schema_1.emailTemplates.template_name);
        res.json({ success: true, data: templates });
    }
    catch (err) {
        next(err);
    }
}
async function getEmailTemplateById(req, res, next) {
    try {
        const template = await database_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)))
            .get();
        if (!template) {
            res.status(404).json({ success: false, error: 'Template not found' });
            return;
        }
        res.json({ success: true, data: template });
    }
    catch (err) {
        next(err);
    }
}
async function createEmailTemplate(req, res, next) {
    try {
        const { template_name, subject_template, html_template, description, is_active } = req.body;
        const template = await database_1.db.insert(schema_1.emailTemplates).values({
            id: crypto_1.default.randomUUID(),
            template_name,
            subject_template: subject_template || '',
            html_template,
            description: description || '',
            is_active: is_active ?? true,
        }).returning().get();
        (0, settingsService_1.clearSettingsCache)();
        res.json({ success: true, data: template });
    }
    catch (err) {
        next(err);
    }
}
async function updateEmailTemplate(req, res, next) {
    try {
        const existing = await database_1.db
            .select({ id: schema_1.emailTemplates.id })
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Template not found' });
            return;
        }
        const { subject_template, html_template, description, is_active } = req.body;
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (subject_template !== undefined)
            updateData.subject_template = subject_template;
        if (html_template !== undefined)
            updateData.html_template = html_template;
        if (description !== undefined)
            updateData.description = description;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        await database_1.db.update(schema_1.emailTemplates).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)));
        (0, settingsService_1.clearSettingsCache)();
        const updated = await database_1.db
            .select()
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)))
            .get();
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
}
async function deleteEmailTemplate(req, res, next) {
    try {
        const existing = await database_1.db
            .select({ id: schema_1.emailTemplates.id })
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Template not found' });
            return;
        }
        await database_1.db.delete(schema_1.emailTemplates).where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.id, String(req.params.id)));
        (0, settingsService_1.clearSettingsCache)();
        res.json({ success: true, message: 'Template deleted' });
    }
    catch (err) {
        next(err);
    }
}
// Order Notification Recipients
async function getOrderNotificationRecipients(req, res, next) {
    try {
        const recipients = await database_1.db
            .select()
            .from(schema_1.orderNotificationRecipients)
            .orderBy(schema_1.orderNotificationRecipients.sort_order)
            .where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.is_active, true));
        res.json({ success: true, data: recipients });
    }
    catch (err) {
        next(err);
    }
}
async function createOrderNotificationRecipient(req, res, next) {
    try {
        const { email, name, is_active, sort_order } = req.body;
        const recipient = await database_1.db.insert(schema_1.orderNotificationRecipients).values({
            id: crypto_1.default.randomUUID(),
            email,
            name: name || '',
            is_active: is_active ?? true,
            sort_order: sort_order ?? 0,
        }).returning().get();
        res.json({ success: true, data: recipient });
    }
    catch (err) {
        next(err);
    }
}
async function updateOrderNotificationRecipient(req, res, next) {
    try {
        const existing = await database_1.db
            .select({ id: schema_1.orderNotificationRecipients.id })
            .from(schema_1.orderNotificationRecipients)
            .where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.id, String(req.params.id)))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Recipient not found' });
            return;
        }
        const { email, name, is_active, sort_order } = req.body;
        const updateData = {};
        if (email !== undefined)
            updateData.email = email;
        if (name !== undefined)
            updateData.name = name;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        if (sort_order !== undefined)
            updateData.sort_order = sort_order;
        await database_1.db.update(schema_1.orderNotificationRecipients).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.id, String(req.params.id)));
        const updated = await database_1.db
            .select()
            .from(schema_1.orderNotificationRecipients)
            .where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.id, String(req.params.id)))
            .get();
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
}
async function deleteOrderNotificationRecipient(req, res, next) {
    try {
        const existing = await database_1.db
            .select({ id: schema_1.orderNotificationRecipients.id })
            .from(schema_1.orderNotificationRecipients)
            .where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.id, String(req.params.id)))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Recipient not found' });
            return;
        }
        await database_1.db.delete(schema_1.orderNotificationRecipients).where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.id, String(req.params.id)));
        res.json({ success: true, message: 'Recipient deleted' });
    }
    catch (err) {
        next(err);
    }
}
// Subscriptions
async function getSubscriptions(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
        const offset = (page - 1) * limit;
        const [rows, countRows] = await Promise.all([
            database_1.db
                .select()
                .from(schema_1.subscriptions)
                .orderBy(schema_1.subscriptions.subscribed_at)
                .limit(limit)
                .offset(offset),
            database_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.subscriptions),
        ]);
        res.json({
            success: true,
            data: rows,
            meta: {
                total: countRows[0]?.count ?? 0,
                page,
                limit,
                total_pages: Math.ceil((countRows[0]?.count ?? 0) / limit),
            }
        });
    }
    catch (err) {
        next(err);
    }
}
async function deleteSubscription(req, res, next) {
    try {
        const existing = await database_1.db
            .select({ id: schema_1.subscriptions.id })
            .from(schema_1.subscriptions)
            .where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, String(req.params.id)))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Subscription not found' });
            return;
        }
        await database_1.db.delete(schema_1.subscriptions).where((0, drizzle_orm_1.eq)(schema_1.subscriptions.id, String(req.params.id)));
        res.json({ success: true, message: 'Subscription removed' });
    }
    catch (err) {
        next(err);
    }
}
// Navbar Settings
async function getNavbarSettings(req, res, next) {
    try {
        const settings = await database_1.db.select().from(schema_1.navbarSettings);
        const map = {};
        for (const row of settings) {
            map[row.setting_key] = row.setting_value;
        }
        res.json({ success: true, data: map });
    }
    catch (err) {
        next(err);
    }
}
async function updateNavbarSettings(req, res, next) {
    try {
        const { settings } = req.body;
        if (!Array.isArray(settings) || settings.length === 0) {
            res.status(400).json({ success: false, error: 'settings array is required' });
            return;
        }
        const now = new Date().toISOString();
        for (const { key, value } of settings) {
            const existing = await database_1.db
                .select()
                .from(schema_1.navbarSettings)
                .where((0, drizzle_orm_1.eq)(schema_1.navbarSettings.setting_key, key))
                .get();
            if (existing) {
                await database_1.db.update(schema_1.navbarSettings).set({ setting_value: value, updated_at: now }).where((0, drizzle_orm_1.eq)(schema_1.navbarSettings.setting_key, key));
            }
            else {
                await database_1.db.insert(schema_1.navbarSettings).values({
                    id: crypto_1.default.randomUUID(),
                    setting_key: key,
                    setting_value: value,
                    is_active: true,
                    updated_at: now,
                });
            }
        }
        (0, settingsService_1.clearSettingsCache)();
        res.json({ success: true, message: 'Navbar settings updated' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=emailTemplateController.js.map