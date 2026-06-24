import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_PATH: z.string().default('./data/jdm.db'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  AUTHORIZE_NET_API_LOGIN_ID: z.string().optional(),
  AUTHORIZE_NET_TRANSACTION_KEY: z.string().optional(),
  AUTHORIZE_NET_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),

  EMAIL_HOST: z.string().min(1, 'EMAIL_HOST is required'),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required'),
  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required'),
  OWNER_EMAIL: z.string().email('OWNER_EMAIL must be a valid email'),

  GOOGLE_MERCHANT_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY_PATH: z.string().optional(),

  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),

  ADMIN_INITIAL_EMAIL: z.string().email('ADMIN_INITIAL_EMAIL must be a valid email'),
  ADMIN_INITIAL_PASSWORD: z.string().min(8, 'ADMIN_INITIAL_PASSWORD must be at least 8 characters'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
