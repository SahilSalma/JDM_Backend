import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

import { env } from './config/env';
import { requestLogger, logger } from './middleware/logger';
import cron from 'node-cron';
import { syncAllProducts } from './services/merchantService';
import { generalRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

// Routes
import productRoutes from './routes/products';
import checkoutRoutes from './routes/checkout';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import blogRoutes from './routes/blog';
import shippingRoutes from './routes/shipping';
import orderRoutes from './routes/orders';
import seoRoutes from './routes/seo';
import newsletterRoutes from './routes/newsletter';
import contactRoutes from './routes/contact';
import reviewRoutes from './routes/reviews';

const app = express();

app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Webhook route (raw body BEFORE json parser) ──────────────────────────────

app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRoutes,
);

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Request logging ──────────────────────────────────────────────────────────

app.use(requestLogger);

// ─── Rate limiting ────────────────────────────────────────────────────────────

app.use('/api/', generalRateLimit);

// ─── Static file serving for uploaded images ─────────────────────────────────

app.use('/api/uploads', express.static(path.resolve('uploads')));

// ─── SEO routes (outside /api prefix for clean URLs) ─────────────────────────

app.use('/', seoRoutes);

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

// Schedule daily Google Merchant Catalog sync at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
  logger.info('Starting scheduled daily Google Merchant catalog sync...');
  try {
    const result = await syncAllProducts();
    logger.info(result, 'Scheduled daily Google Merchant catalog sync completed');
  } catch (err) {
    logger.error({ err }, 'Scheduled daily Google Merchant catalog sync failed');
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      frontendUrl: env.FRONTEND_URL,
    },
    `JDM Motors API server listening on port ${env.PORT}`,
  );
});

export default app;
