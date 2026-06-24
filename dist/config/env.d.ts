export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_PATH: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    AUTHORIZE_NET_ENVIRONMENT: "production" | "sandbox";
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_USER: string;
    EMAIL_PASSWORD: string;
    OWNER_EMAIL: string;
    NEXT_PUBLIC_API_URL: string;
    ADMIN_INITIAL_EMAIL: string;
    ADMIN_INITIAL_PASSWORD: string;
    FRONTEND_URL: string;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    STRIPE_PUBLISHABLE_KEY?: string | undefined;
    AUTHORIZE_NET_API_LOGIN_ID?: string | undefined;
    AUTHORIZE_NET_TRANSACTION_KEY?: string | undefined;
    GOOGLE_MERCHANT_ID?: string | undefined;
    GOOGLE_SERVICE_ACCOUNT_KEY?: string | undefined;
    GOOGLE_SERVICE_ACCOUNT_KEY_PATH?: string | undefined;
};
export type Env = typeof env;
//# sourceMappingURL=env.d.ts.map