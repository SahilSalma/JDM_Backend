"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_PATH: zod_1.z.string().default('./data/jdm.db'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: zod_1.z.string().optional(),
    AUTHORIZE_NET_API_LOGIN_ID: zod_1.z.string().optional(),
    AUTHORIZE_NET_TRANSACTION_KEY: zod_1.z.string().optional(),
    AUTHORIZE_NET_ENVIRONMENT: zod_1.z.enum(['sandbox', 'production']).default('sandbox'),
    EMAIL_HOST: zod_1.z.string().min(1, 'EMAIL_HOST is required'),
    EMAIL_PORT: zod_1.z.coerce.number().default(587),
    EMAIL_USER: zod_1.z.string().min(1, 'EMAIL_USER is required'),
    EMAIL_PASSWORD: zod_1.z.string().min(1, 'EMAIL_PASSWORD is required'),
    OWNER_EMAIL: zod_1.z.string().email('OWNER_EMAIL must be a valid email'),
    GOOGLE_MERCHANT_ID: zod_1.z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_KEY: zod_1.z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_KEY_PATH: zod_1.z.string().optional(),
    NEXT_PUBLIC_API_URL: zod_1.z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
    ADMIN_INITIAL_EMAIL: zod_1.z.string().email('ADMIN_INITIAL_EMAIL must be a valid email'),
    ADMIN_INITIAL_PASSWORD: zod_1.z.string().min(8, 'ADMIN_INITIAL_PASSWORD must be at least 8 characters'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
});
const _parsed = envSchema.safeParse(process.env);
if (!_parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(_parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = _parsed.data;
//# sourceMappingURL=env.js.map