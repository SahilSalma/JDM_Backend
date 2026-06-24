"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmation = sendOrderConfirmation;
exports.sendOrderNotification = sendOrderNotification;
exports.sendShippingConfirmation = sendShippingConfirmation;
exports.sendCustomEmail = sendCustomEmail;
exports.resendEmail = resendEmail;
exports.sendContactEmails = sendContactEmails;
exports.getEmailLogById = getEmailLogById;
exports.getEmailTemplates = getEmailTemplates;
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const currency_1 = require("../utils/currency");
const logger_1 = require("../middleware/logger");
const settingsService_1 = require("./settingsService");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.EMAIL_HOST,
    port: env_1.env.EMAIL_PORT,
    secure: env_1.env.EMAIL_PORT === 465,
    auth: {
        user: env_1.env.EMAIL_USER,
        pass: env_1.env.EMAIL_PASSWORD,
    },
});
const TEMPLATES_DIR = path_1.default.resolve('emails/templates');
// Register Handlebars helpers
handlebars_1.default.registerHelper('formatPrice', (cents) => {
    if (cents === undefined || cents === null)
        return '$0.00';
    const numericCents = typeof cents === 'string' ? parseFloat(cents) : cents;
    if (isNaN(numericCents))
        return '$0.00';
    return `$${(numericCents / 100).toFixed(2)}`;
});
handlebars_1.default.registerHelper('isDarkMode', (theme) => theme === 'dark');
handlebars_1.default.registerHelper('contains', (haystack, needle) => {
    if (!haystack || !needle)
        return false;
    return haystack.includes(needle);
});
// Register Handlebars partials
const PARTIALS_DIR = path_1.default.join(TEMPLATES_DIR, 'partials');
if (fs_1.default.existsSync(PARTIALS_DIR)) {
    fs_1.default.readdirSync(PARTIALS_DIR).forEach((file) => {
        if (file.endsWith('.hbs')) {
            const partialName = file.replace('.hbs', '');
            const source = fs_1.default.readFileSync(path_1.default.join(PARTIALS_DIR, file), 'utf-8');
            handlebars_1.default.registerPartial(partialName, source);
        }
    });
}
async function getFooterContext() {
    const shopName = await (0, settingsService_1.getSettingValue)('email_shop_name', 'JDM Tokyo Motorsports');
    const shopPhone = await (0, settingsService_1.getSettingValue)('contact_phone', '(555) 123-4567');
    const shopEmail = await (0, settingsService_1.getSettingValue)('contact_email', 'support@jdmtokyomotors.com');
    const shopAddress = await (0, settingsService_1.getSettingValue)('contact_address', '123 Motorsports Blvd, Los Angeles, CA 90001');
    const copyrightYear = await (0, settingsService_1.getSettingValue)('email_copyright_year', '2026');
    return {
        shopName,
        shopPhone,
        shopEmail,
        shopAddress,
        year: copyrightYear,
    };
}
async function getHeaderContext(theme = 'light') {
    const defaultLogo = theme === 'dark'
        ? `${env_1.env.FRONTEND_URL}/logo/finallogo-whitelettering-transparent.png`
        : `${env_1.env.FRONTEND_URL}/logo/finallogo-blacklettering-transparent.png`;
    const logoUrlSetting = theme === 'dark'
        ? await (0, settingsService_1.getSettingValue)('email_logo_url_dark', '')
        : await (0, settingsService_1.getSettingValue)('email_logo_url_light', '');
    const logoUrl = logoUrlSetting || defaultLogo;
    const logoAlt = await (0, settingsService_1.getSettingValue)('email_logo_alt', 'JDM Tokyo Motorsports');
    const logoWidth = await (0, settingsService_1.getSettingValue)('email_logo_width', '220');
    return {
        logoUrl,
        logoAlt,
        logoWidth,
    };
}
function loadTemplate(name) {
    const filePath = path_1.default.join(TEMPLATES_DIR, `${name}.hbs`);
    if (!fs_1.default.existsSync(filePath))
        return null;
    const source = fs_1.default.readFileSync(filePath, 'utf-8');
    return handlebars_1.default.compile(source);
}
async function logEmail(recipientEmail, subject, templateUsed, orderId, status, bodyContent, hasAttachment) {
    await database_1.db.insert(schema_1.emailLog).values({
        id: crypto_1.default.randomUUID(),
        order_id: orderId ?? undefined,
        recipient_email: recipientEmail,
        template_used: templateUsed ?? undefined,
        subject,
        body_content: bodyContent,
        has_attachment: hasAttachment ?? false,
        sent_at: new Date().toISOString(),
        status,
    });
}
// Cache for email templates
let emailTemplateCache = null;
let templateCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute
async function loadEmailTemplateFromDB(name) {
    const now = Date.now();
    // Check cache
    if (emailTemplateCache && (now - templateCacheTime) < CACHE_TTL) {
        if (emailTemplateCache[name]) {
            return emailTemplateCache[name];
        }
    }
    // Load from database
    try {
        const rows = await database_1.db.select().from(schema_1.emailTemplates);
        const cache = {};
        for (const row of rows) {
            try {
                cache[row.template_name] = handlebars_1.default.compile(row.html_template);
            }
            catch (e) {
                cache[row.template_name] = null;
                logger_1.logger.error({ template: row.template_name }, 'Failed to compile email template');
            }
        }
        emailTemplateCache = cache;
        templateCacheTime = now;
        return cache[name] || null;
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to load email templates from database');
        return null;
    }
}
function clearEmailTemplateCache() {
    emailTemplateCache = null;
    templateCacheTime = 0;
}
// Get order notification recipients from database
async function getOrderNotificationRecipientsFromDB() {
    try {
        const rows = await database_1.db
            .select({ email: schema_1.orderNotificationRecipients.email })
            .from(schema_1.orderNotificationRecipients)
            .where((0, drizzle_orm_1.eq)(schema_1.orderNotificationRecipients.is_active, true))
            .orderBy(schema_1.orderNotificationRecipients.sort_order);
        return rows.map((r) => r.email);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to load order notification recipients');
        return [env_1.env.OWNER_EMAIL];
    }
}
function extractPolicyContent(html) {
    // Try editable comments first
    const commentMatch = html.match(/<!--\s*editable:policy_text\s*-->([\s\S]*?)<!--\s*\/editable:policy_text\s*-->/);
    if (commentMatch)
        return commentMatch[1].trim();
    // Try <p> tag content (with any attributes)
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch)
        return pMatch[1].trim();
    // Try stripping all HTML tags
    const stripped = html.replace(/<[^>]+>/g, '').trim();
    if (stripped)
        return stripped;
    return html.trim();
}
// Get returns/refunds policy text from settings
async function getReturnsRefundsPolicy() {
    try {
        const row = await database_1.db
            .select({ value: schema_1.emailTemplates.html_template })
            .from(schema_1.emailTemplates)
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.template_name, 'returns_refunds_policy'))
            .get();
        if (row && row.value) {
            return extractPolicyContent(row.value);
        }
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to load returns/refunds policy');
    }
    // Default fallback
    return `For returns or refunds, please contact us via email at <a href="mailto:support@jdmtokyomotors.com" style="color:#DC2626; text-decoration:none;">support@jdmtokyomotors.com</a> or by phone at <strong>+1 (555) 000-0000</strong> within 30 days of delivery. All refunds are processed through our payment provider and may take 3&ndash;7 business days to appear on your statement. Items must be in original, unused condition and in their original packaging. Electrical components and special-order parts may be subject to a restocking fee.`;
}
// Get navbar settings from database
async function getNavbarSettingsFromDB() {
    try {
        // We'll use the navbar_settings table which we'll create
        // For now, return default values
        return {};
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to load navbar settings');
        return {};
    }
}
function getThemeColors(theme) {
    const isDark = theme === 'dark';
    return {
        bodyBg: isDark ? '#121212' : '#f3f4f6',
        containerBg: isDark ? '#1e1e1e' : '#FFFFFF',
        cardBg: isDark ? '#262626' : '#FFFFFF',
        cardBorder: isDark ? '#374151' : '#e5e7eb',
        textColor: isDark ? '#f3f4f6' : '#111827',
        textMuted: isDark ? '#9ca3af' : '#6b7280',
        titleBorder: isDark ? '#DC2626' : '#000000',
        rowEvenBg: isDark ? '#2d2a29' : '#f9fafb',
        rowOddBg: isDark ? '#1e1e1e' : '#FFFFFF',
        rowBorder: isDark ? '#374151' : '#e5e7eb',
        accentColor: isDark ? '#ef4444' : '#DC2626',
        dividerColor: isDark ? '#ef4444' : '#000000',
        notesBg: isDark ? '#451a03' : '#fffbeb',
        notesText: isDark ? '#fcd34d' : '#92400e',
        notesBorder: isDark ? '#b45309' : '#f59e0b',
    };
}
async function sendOrderConfirmation(order) {
    const templateName = 'order-confirmation';
    const template = (await loadEmailTemplateFromDB(templateName)) || loadTemplate(templateName);
    const subject = `Order Confirmed - ${order.order_number}`;
    const subtotal = order.total_cents - order.shipping_cents;
    const shippingMethod = order.shipping_type === 'forklift'
        ? 'With Forklift'
        : order.shipping_type === 'no_forklift'
            ? 'Without Forklift'
            : order.shipping_type === 'liftgate'
                ? 'Liftgate Delivery'
                : 'Residential Delivery';
    const returnsRefundsPolicy = await getReturnsRefundsPolicy();
    const theme = order.theme || 'light';
    const colors = getThemeColors(theme);
    const headerCtx = await getHeaderContext(theme);
    const footerCtx = await getFooterContext();
    const html = template
        ? template({
            orderNumber: order.order_number,
            customerFirstName: order.customer_first_name,
            customerLastName: order.customer_last_name,
            subtotal: subtotal,
            shippingCost: order.shipping_cents,
            shippingMethod: shippingMethod,
            total: order.total_cents,
            shippingAddress: {
                name: `${order.customer_first_name} ${order.customer_last_name}`,
                line1: order.shipping_line1,
                line2: order.shipping_line2 || null,
                city: order.shipping_city,
                state: order.shipping_state,
                zip: order.shipping_zip,
                country: order.shipping_country || 'US',
            },
            billingAddress: order.billing_line1 && (order.billing_line1 !== order.shipping_line1 ||
                order.billing_city !== order.shipping_city) ? {
                name: `${order.customer_first_name} ${order.customer_last_name}`,
                line1: order.billing_line1,
                line2: order.billing_line2 || null,
                city: order.billing_city,
                state: order.billing_state,
                zip: order.billing_zip,
                country: order.billing_country || 'US',
            } : null,
            items: (order.items ?? []).map((i) => ({
                title: i.product_title,
                sku: i.product_sku,
                quantity: i.quantity,
                unitPrice: i.unit_price_cents,
                lineTotal: i.total_cents,
            })),
            frontendUrl: env_1.env.FRONTEND_URL,
            ...headerCtx,
            shop_name: footerCtx.shopName,
            theme,
            colors,
            returnsRefundsPolicy,
            customerNotes: order.customer_notes || null,
            ...footerCtx,
        })
        : `<p>Thank you for your order ${order.order_number}. Total: $${(order.total_cents / 100).toFixed(2)}</p>`;
    try {
        await transporter.sendMail({
            from: `"JDM Tokyo Motorsports" <${env_1.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject,
            html,
        });
        await logEmail(order.customer_email, subject, templateName, order.id, 'sent', html);
        logger_1.logger.info({ orderId: order.id, recipient: order.customer_email }, 'Order confirmation sent');
    }
    catch (err) {
        await logEmail(order.customer_email, subject, templateName, order.id, 'failed', html);
        logger_1.logger.error({ err, orderId: order.id }, 'Failed to send order confirmation');
    }
}
async function sendOrderNotification(order, theme) {
    const templateName = 'order-notification';
    const template = (await loadEmailTemplateFromDB(templateName)) || loadTemplate(templateName);
    const subject = `New Order Received - ${order.order_number}`;
    const subtotal = order.total_cents - order.shipping_cents;
    const shippingMethod = order.shipping_type === 'forklift'
        ? 'With Forklift'
        : order.shipping_type === 'no_forklift'
            ? 'Without Forklift'
            : order.shipping_type === 'liftgate'
                ? 'Liftgate Delivery'
                : 'Residential Delivery';
    const returnsRefundsPolicy = await getReturnsRefundsPolicy();
    const activeTheme = (theme || order.theme) === 'dark' ? 'dark' : 'light';
    const colors = getThemeColors(activeTheme);
    const headerCtx = await getHeaderContext(activeTheme);
    const footerCtx = await getFooterContext();
    const html = template
        ? template({
            orderNumber: order.order_number,
            customerName: `${order.customer_first_name} ${order.customer_last_name}`,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone || '',
            subtotal: subtotal,
            shippingCost: order.shipping_cents,
            shippingMethod: shippingMethod,
            total: order.total_cents,
            shippingAddress: {
                name: `${order.customer_first_name} ${order.customer_last_name}`,
                line1: order.shipping_line1,
                line2: order.shipping_line2 || null,
                city: order.shipping_city,
                state: order.shipping_state,
                zip: order.shipping_zip,
                country: order.shipping_country || 'US',
                type: shippingMethod,
            },
            billingAddress: order.billing_line1 && (order.billing_line1 !== order.shipping_line1 ||
                order.billing_city !== order.shipping_city) ? {
                name: `${order.customer_first_name} ${order.customer_last_name}`,
                line1: order.billing_line1,
                line2: order.billing_line2 || null,
                city: order.billing_city,
                state: order.billing_state,
                zip: order.billing_zip,
                country: order.billing_country || 'US',
            } : null,
            items: (order.items ?? []).map((i) => ({
                title: i.product_title,
                sku: i.product_sku,
                quantity: i.quantity,
                unitPrice: i.unit_price_cents,
                lineTotal: i.total_cents,
            })),
            adminUrl: env_1.env.FRONTEND_URL,
            frontendUrl: env_1.env.FRONTEND_URL,
            ...headerCtx,
            orderId: order.id,
            theme: activeTheme,
            colors,
            returnsRefundsPolicy,
            customerNotes: order.customer_notes || null,
            ...footerCtx,
        })
        : `<p>New order ${order.order_number} from ${order.customer_email}. Total: ${(0, currency_1.formatPrice)(order.total_cents)}</p>`;
    // Get recipients from database
    const recipients = await getOrderNotificationRecipientsFromDB();
    // Send to each recipient
    const sendPromises = recipients.map(async (recipient) => {
        try {
            await transporter.sendMail({
                from: `"JDM Tokyo Motorsports" <${env_1.env.EMAIL_USER}>`,
                to: recipient,
                subject,
                html,
            });
            await logEmail(recipient, subject, templateName, order.id, 'sent', html);
            logger_1.logger.info({ orderId: order.id, recipient }, 'Order notification sent');
        }
        catch (err) {
            await logEmail(recipient, subject, templateName, order.id, 'failed', html);
            logger_1.logger.error({ err, orderId: order.id, recipient }, 'Failed to send order notification');
        }
    });
    await Promise.all(sendPromises);
}
async function sendShippingConfirmation(order) {
    const templateName = 'shipping-confirmation';
    const template = (await loadEmailTemplateFromDB(templateName)) || loadTemplate(templateName);
    const subject = `Your Order Has Shipped - ${order.order_number}`;
    const returnsRefundsPolicy = await getReturnsRefundsPolicy();
    const theme = order.theme || 'light';
    const colors = getThemeColors(theme);
    const headerCtx = await getHeaderContext(theme);
    const footerCtx = await getFooterContext();
    const html = template
        ? template({
            orderNumber: order.order_number,
            customerFirstName: order.customer_first_name,
            trackingNumber: order.tracking_number,
            carrier: order.carrier,
            shop_name: footerCtx.shopName,
            frontendUrl: env_1.env.FRONTEND_URL,
            ...headerCtx,
            theme,
            colors,
            returnsRefundsPolicy,
            items: (order.items ?? []).map((i) => ({
                title: i.product_title,
                sku: i.product_sku,
                quantity: i.quantity,
                lineTotal: i.total_cents,
            })),
            ...footerCtx,
        })
        : `<p>Your order ${order.order_number} has shipped. Tracking: ${order.tracking_number ?? 'N/A'}</p>`;
    try {
        await transporter.sendMail({
            from: `"JDM Tokyo Motorsports" <${env_1.env.EMAIL_USER}>`,
            to: order.customer_email,
            subject,
            html,
        });
        await logEmail(order.customer_email, subject, templateName, order.id, 'sent', html);
        logger_1.logger.info({ orderId: order.id }, 'Shipping confirmation sent');
    }
    catch (err) {
        await logEmail(order.customer_email, subject, templateName, order.id, 'failed', html);
        logger_1.logger.error({ err, orderId: order.id }, 'Failed to send shipping confirmation');
    }
}
async function sendCustomEmail(to, subject, body, templateEnabled = false, attachments, orderId, theme) {
    let html = '';
    if (templateEnabled) {
        const templateName = 'custom-message';
        const template = (await loadEmailTemplateFromDB(templateName)) || loadTemplate(templateName);
        const returnsRefundsPolicy = await getReturnsRefundsPolicy();
        const activeTheme = theme === 'dark' ? 'dark' : 'light';
        const colors = getThemeColors(activeTheme);
        const headerCtx = await getHeaderContext(activeTheme);
        const footerCtx = await getFooterContext();
        html = template
            ? template({
                subject,
                body,
                useTemplate: true,
                returnsRefundsPolicy,
                colors,
                frontendUrl: env_1.env.FRONTEND_URL,
                ...headerCtx,
                ...footerCtx,
            })
            : body;
    }
    else {
        html = `<div style="font-family:sans-serif;">${body}</div>`;
    }
    const processedAttachments = attachments?.map((att) => {
        if (att.content) {
            return { filename: att.filename, content: att.content, encoding: 'base64' };
        }
        return { filename: att.filename, path: att.path };
    });
    try {
        await transporter.sendMail({
            from: `"JDM Tokyo Motorsports" <${env_1.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments: processedAttachments,
        });
        await logEmail(to, subject, null, orderId ?? null, 'sent', html, !!attachments?.length);
        logger_1.logger.info({ to, subject }, 'Custom email sent');
    }
    catch (err) {
        await logEmail(to, subject, null, orderId ?? null, 'failed', html, !!attachments?.length);
        logger_1.logger.error({ err, to, subject }, 'Failed to send custom email');
        throw err;
    }
}
async function resendEmail(logId) {
    const log = await database_1.db
        .select()
        .from(schema_1.emailLog)
        .where((0, drizzle_orm_1.eq)(schema_1.emailLog.id, logId))
        .get();
    if (!log) {
        throw new Error('Email log entry not found');
    }
    if (!log.body_content) {
        throw new Error('Cannot retry: email body content was not saved');
    }
    try {
        await transporter.sendMail({
            from: `"JDM Tokyo Motorsports" <${env_1.env.EMAIL_USER}>`,
            to: log.recipient_email,
            subject: log.subject,
            html: log.body_content,
        });
        await logEmail(log.recipient_email, log.subject, log.template_used, log.order_id ?? null, 'sent', log.body_content, !!log.has_attachment);
        logger_1.logger.info({ logId, to: log.recipient_email }, 'Email resent successfully');
    }
    catch (err) {
        await logEmail(log.recipient_email, log.subject, log.template_used, log.order_id ?? null, 'failed', log.body_content, !!log.has_attachment);
        logger_1.logger.error({ err, logId, to: log.recipient_email }, 'Failed to resend email');
        throw err;
    }
}
async function sendContactEmails(name, email, phone, subject, message) {
    const footerCtx = await getFooterContext();
    const theme = 'light';
    const colors = getThemeColors(theme);
    const headerCtx = await getHeaderContext(theme);
    const returnsRefundsPolicy = await getReturnsRefundsPolicy();
    const context = {
        name,
        email,
        phone: phone || '',
        subject,
        message,
        frontendUrl: env_1.env.FRONTEND_URL,
        theme,
        colors,
        ...headerCtx,
        ...footerCtx,
    };
    // Send notification to owner/admin recipients
    const notificationTemplateName = 'contact-notification';
    const notificationTemplate = (await loadEmailTemplateFromDB(notificationTemplateName)) || loadTemplate(notificationTemplateName);
    const notificationSubject = `New Contact Form Inquiry - ${subject}`;
    const notificationHtml = notificationTemplate
        ? notificationTemplate(context)
        : `<h2>New Contact Form Submission</h2><p><strong>From:</strong> ${name} (${email})</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message}</p>`;
    const recipients = await getOrderNotificationRecipientsFromDB();
    const sendPromises = recipients.map(async (recipient) => {
        try {
            await transporter.sendMail({
                from: `"${footerCtx.shopName}" <${env_1.env.EMAIL_USER}>`,
                to: recipient,
                subject: notificationSubject,
                html: notificationHtml,
            });
            await logEmail(recipient, notificationSubject, notificationTemplateName, null, 'sent', notificationHtml);
        }
        catch (err) {
            await logEmail(recipient, notificationSubject, notificationTemplateName, null, 'failed', notificationHtml);
            logger_1.logger.error({ err, recipient }, 'Failed to send contact notification');
        }
    });
    // Send confirmation to the customer
    const confirmationTemplateName = 'contact-confirmation';
    const confirmationTemplate = (await loadEmailTemplateFromDB(confirmationTemplateName)) || loadTemplate(confirmationTemplateName);
    const confirmationSubject = `We received your message - ${subject}`;
    const confirmationHtml = confirmationTemplate
        ? confirmationTemplate(context)
        : `<h2>Thank you for contacting us!</h2><p>We have received your message and will get back to you within 24 hours.</p><hr/><p><strong>Your message:</strong></p><p>${message}</p>`;
    try {
        await transporter.sendMail({
            from: `"${footerCtx.shopName}" <${env_1.env.EMAIL_USER}>`,
            to: email,
            subject: confirmationSubject,
            html: confirmationHtml,
        });
        await logEmail(email, confirmationSubject, confirmationTemplateName, null, 'sent', confirmationHtml);
    }
    catch (err) {
        await logEmail(email, confirmationSubject, confirmationTemplateName, null, 'failed', confirmationHtml);
        logger_1.logger.error({ err, email }, 'Failed to send contact confirmation');
    }
    await Promise.all(sendPromises);
}
async function getEmailLogById(logId) {
    return database_1.db
        .select()
        .from(schema_1.emailLog)
        .where((0, drizzle_orm_1.eq)(schema_1.emailLog.id, logId))
        .get();
}
function getEmailTemplates() {
    if (!fs_1.default.existsSync(TEMPLATES_DIR))
        return [];
    return fs_1.default
        .readdirSync(TEMPLATES_DIR)
        .filter((f) => f.endsWith('.hbs'))
        .map((f) => f.replace('.hbs', ''));
}
//# sourceMappingURL=emailService.js.map