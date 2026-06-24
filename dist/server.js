"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const logger_1 = require("./middleware/logger");
const node_cron_1 = __importDefault(require("node-cron"));
const merchantService_1 = require("./services/merchantService");
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const products_1 = __importDefault(require("./routes/products"));
const checkout_1 = __importDefault(require("./routes/checkout"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const admin_1 = __importDefault(require("./routes/admin"));
const blog_1 = __importDefault(require("./routes/blog"));
const shipping_1 = __importDefault(require("./routes/shipping"));
const orders_1 = __importDefault(require("./routes/orders"));
const seo_1 = __importDefault(require("./routes/seo"));
const newsletter_1 = __importDefault(require("./routes/newsletter"));
const contact_1 = __importDefault(require("./routes/contact"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
// ─── Security ─────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: env_1.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Webhook route (raw body BEFORE json parser) ──────────────────────────────
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhooks_1.default);
// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ─── Request logging ──────────────────────────────────────────────────────────
app.use(logger_1.requestLogger);
// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('/api/', rateLimit_1.generalRateLimit);
// ─── Static file serving for uploaded images ─────────────────────────────────
app.use('/api/uploads', express_1.default.static(path_1.default.resolve('uploads')));
// ─── SEO routes (outside /api prefix for clean URLs) ─────────────────────────
app.use('/', seo_1.default);
// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/products', products_1.default);
app.use('/api/checkout', checkout_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/shipping', shipping_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/newsletter', newsletter_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/reviews', reviews_1.default);
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env_1.env.NODE_ENV,
    });
});
// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Scheduled Tasks ──────────────────────────────────────────────────────────
// Schedule daily Google Merchant Catalog sync at midnight (0 0 * * *)
node_cron_1.default.schedule('0 0 * * *', async () => {
    logger_1.logger.info('Starting scheduled daily Google Merchant catalog sync...');
    try {
        const result = await (0, merchantService_1.syncAllProducts)();
        logger_1.logger.info(result, 'Scheduled daily Google Merchant catalog sync completed');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Scheduled daily Google Merchant catalog sync failed');
    }
});
// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(env_1.env.PORT, () => {
    logger_1.logger.info({
        port: env_1.env.PORT,
        env: env_1.env.NODE_ENV,
        frontendUrl: env_1.env.FRONTEND_URL,
    }, `JDM Motors API server listening on port ${env_1.env.PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map