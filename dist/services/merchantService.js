"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProduct = syncProduct;
exports.deleteProductFromMerchant = deleteProductFromMerchant;
exports.syncAllProducts = syncAllProducts;
exports.generateProductFeed = generateProductFeed;
const googleapis_1 = require("googleapis");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const env_1 = require("../config/env");
const logger_1 = require("../middleware/logger");
const fs_1 = __importDefault(require("fs"));
let contentClient = null;
/**
 * Initializes and caches the Google Content API client using Service Account credentials.
 */
function getGoogleAuthClient() {
    if (contentClient)
        return contentClient;
    try {
        let credentials;
        if (env_1.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            credentials = JSON.parse(env_1.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        }
        else if (env_1.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
            const fileContent = fs_1.default.readFileSync(env_1.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, 'utf8');
            credentials = JSON.parse(fileContent);
        }
        else {
            logger_1.logger.warn('Google Service Account credentials are not configured. Google Merchant integration runs in offline mock mode.');
            return null;
        }
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/content'],
        });
        contentClient = googleapis_1.google.content({
            version: 'v2.1',
            auth,
        });
        return contentClient;
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Failed to initialize Google Merchant Content API client');
        return null;
    }
}
/**
 * Syncs a single product to Google Merchant Center using the Content API.
 */
async function syncProduct(product) {
    const client = getGoogleAuthClient();
    if (!client) {
        logger_1.logger.warn({ productId: product.id }, 'Google Merchant API client not initialized. Marking product as synced (mock).');
        await database_1.db
            .update(schema_1.products)
            .set({
            google_merchant_synced: true,
            updated_at: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, product.id));
        return;
    }
    if (!env_1.env.GOOGLE_MERCHANT_ID) {
        logger_1.logger.warn({ productId: product.id }, 'GOOGLE_MERCHANT_ID is not configured, skipping Google Merchant sync');
        return;
    }
    // Construct absolute image URL pointing to backend static server
    // e.g. http://localhost:4000/api/uploads/products/medium/filename.webp
    const apiRootUrl = env_1.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:4000/api
    const imageUrl = product.primary_image_path
        ? `${apiRootUrl}${product.primary_image_path}`
        : '';
    const productUrl = `${env_1.env.FRONTEND_URL}/products/${product.slug}`;
    const priceVal = (product.price_cents / 100).toFixed(2);
    try {
        logger_1.logger.info({ productId: product.id, sku: product.sku }, 'Syncing product to Google Merchant Centre');
        await client.products.insert({
            merchantId: env_1.env.GOOGLE_MERCHANT_ID,
            requestBody: {
                offerId: product.id, // Using internal product ID as unique offer ID
                title: product.title,
                description: product.description || product.title,
                link: productUrl,
                imageLink: imageUrl || undefined,
                contentLanguage: 'en',
                targetCountry: 'US',
                channel: 'online',
                availability: product.quantity > 0 ? 'in stock' : 'out of stock',
                price: {
                    value: priceVal,
                    currency: 'USD',
                },
                condition: 'used', // Default condition for JDM engines/transmissions
                brand: 'JDM Tokyo Motorsports',
                productTypes: [product.category],
                googleProductCategory: '5613', // Part of Vehicle Parts & Accessories -> Engine & Drivetrain
                mpn: product.mpn || undefined,
                gtin: product.gtin || undefined,
            },
        });
        // Mark as synced in DB
        await database_1.db
            .update(schema_1.products)
            .set({
            google_merchant_synced: true,
            google_merchant_id: product.id,
            updated_at: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, product.id));
        logger_1.logger.info({ productId: product.id }, 'Product successfully synced to Google Merchant');
    }
    catch (err) {
        logger_1.logger.error({ err, productId: product.id }, 'Failed to sync product to Google Merchant Center');
        throw err;
    }
}
/**
 * Removes a product from Google Merchant Center.
 */
async function deleteProductFromMerchant(productId) {
    const client = getGoogleAuthClient();
    if (!client)
        return;
    if (!env_1.env.GOOGLE_MERCHANT_ID)
        return;
    try {
        logger_1.logger.info({ productId }, 'Deleting product from Google Merchant Centre');
        await client.products.delete({
            merchantId: env_1.env.GOOGLE_MERCHANT_ID,
            productId: `online:en:US:${productId}`, // Format: channel:contentLanguage:targetCountry:offerId
        });
        logger_1.logger.info({ productId }, 'Product successfully deleted from Google Merchant');
    }
    catch (err) {
        // If product wasn't found on Merchant Center, ignore error
        if (err.status === 404) {
            logger_1.logger.info({ productId }, 'Product not found on Google Merchant Center during deletion, skipping.');
        }
        else {
            logger_1.logger.error({ err, productId }, 'Failed to delete product from Google Merchant Center');
            throw err;
        }
    }
}
/**
 * Syncs all active, non-deleted products to Google Merchant Center.
 */
async function syncAllProducts() {
    const productList = (await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'))));
    let synced = 0;
    let errors = 0;
    for (const product of productList) {
        try {
            await syncProduct(product);
            synced++;
        }
        catch (err) {
            logger_1.logger.error({ err, productId: product.id }, 'Failed to sync product in bulk catalog sync');
            errors++;
        }
    }
    logger_1.logger.info({ synced, errors }, 'Google Merchant bulk catalog sync complete');
    return { synced, errors };
}
/**
 * Generates an RSS 2.0 product feed XML.
 */
async function generateProductFeed() {
    const productList = await database_1.db
        .select()
        .from(schema_1.products)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active')));
    const apiRootUrl = env_1.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:4000/api
    const items = productList
        .map((p) => {
        const imageUrl = p.primary_image_path
            ? `${apiRootUrl}${p.primary_image_path}`
            : '';
        const productUrl = `${env_1.env.FRONTEND_URL}/products/${p.slug}`;
        const price = (p.price_cents / 100).toFixed(2);
        return `  <item>
    <g:id>${escapeXml(p.id)}</g:id>
    <g:title>${escapeXml(p.title)}</g:title>
    <g:description>${escapeXml(p.description ?? p.title)}</g:description>
    <g:link>${escapeXml(productUrl)}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:condition>used</g:condition>
    <g:availability>${p.quantity > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
    <g:price>${price} USD</g:price>
    ${p.compare_at_price_cents ? `<g:sale_price>${(p.compare_at_price_cents / 100).toFixed(2)} USD</g:sale_price>` : ''}
    <g:brand>JDM Tokyo Motorsports</g:brand>
    <g:google_product_category>5613</g:google_product_category>
    <g:product_type>${escapeXml(p.category)}</g:product_type>
    ${p.mpn ? `<g:mpn>${escapeXml(p.mpn)}</g:mpn>` : ''}
    ${p.gtin ? `<g:gtin>${escapeXml(p.gtin)}</g:gtin>` : ''}
    ${p.sku ? `<g:identifier_exists>yes</g:identifier_exists>` : ''}
  </item>`;
    })
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>JDM Tokyo Motorsports - Product Feed</title>
    <link>${escapeXml(env_1.env.FRONTEND_URL)}</link>
    <description>JDM Engines and Transmissions</description>
${items}
  </channel>
</rss>`;
}
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
//# sourceMappingURL=merchantService.js.map