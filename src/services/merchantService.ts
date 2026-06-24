import { google } from 'googleapis';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/database';
import { products } from '../models/schema';
import { env } from '../config/env';
import { logger } from '../middleware/logger';
import fs from 'fs';

export interface MerchantProduct {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  make: string | null;
  model: string | null;
  primary_image_path: string | null;
  gtin: string | null;
  mpn: string | null;
  google_merchant_id: string | null;
  quantity: number;
  category: string;
}

let contentClient: any = null;

/**
 * Initializes and caches the Google Content API client using Service Account credentials.
 */
function getGoogleAuthClient() {
  if (contentClient) return contentClient;

  try {
    let credentials;
    if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } else if (env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
      const fileContent = fs.readFileSync(env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, 'utf8');
      credentials = JSON.parse(fileContent);
    } else {
      logger.warn('Google Service Account credentials are not configured. Google Merchant integration runs in offline mock mode.');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/content'],
    });

    contentClient = google.content({
      version: 'v2.1',
      auth,
    });
    return contentClient;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Google Merchant Content API client');
    return null;
  }
}

/**
 * Syncs a single product to Google Merchant Center using the Content API.
 */
export async function syncProduct(product: MerchantProduct): Promise<void> {
  const client = getGoogleAuthClient();
  if (!client) {
    logger.warn({ productId: product.id }, 'Google Merchant API client not initialized. Marking product as synced (mock).');
    await db
      .update(products)
      .set({
        google_merchant_synced: true,
        updated_at: new Date().toISOString(),
      })
      .where(eq(products.id, product.id));
    return;
  }

  if (!env.GOOGLE_MERCHANT_ID) {
    logger.warn({ productId: product.id }, 'GOOGLE_MERCHANT_ID is not configured, skipping Google Merchant sync');
    return;
  }

  // Construct absolute image URL pointing to backend static server
  // e.g. http://localhost:4000/api/uploads/products/medium/filename.webp
  const apiRootUrl = env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:4000/api
  const imageUrl = product.primary_image_path
    ? `${apiRootUrl}${product.primary_image_path}`
    : '';

  const productUrl = `${env.FRONTEND_URL}/products/${product.slug}`;
  const priceVal = (product.price_cents / 100).toFixed(2);

  try {
    logger.info({ productId: product.id, sku: product.sku }, 'Syncing product to Google Merchant Centre');

    await client.products.insert({
      merchantId: env.GOOGLE_MERCHANT_ID,
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
    await db
      .update(products)
      .set({
        google_merchant_synced: true,
        google_merchant_id: product.id,
        updated_at: new Date().toISOString(),
      })
      .where(eq(products.id, product.id));

    logger.info({ productId: product.id }, 'Product successfully synced to Google Merchant');
  } catch (err) {
    logger.error({ err, productId: product.id }, 'Failed to sync product to Google Merchant Center');
    throw err;
  }
}

/**
 * Removes a product from Google Merchant Center.
 */
export async function deleteProductFromMerchant(productId: string): Promise<void> {
  const client = getGoogleAuthClient();
  if (!client) return;

  if (!env.GOOGLE_MERCHANT_ID) return;

  try {
    logger.info({ productId }, 'Deleting product from Google Merchant Centre');
    await client.products.delete({
      merchantId: env.GOOGLE_MERCHANT_ID,
      productId: `online:en:US:${productId}`, // Format: channel:contentLanguage:targetCountry:offerId
    });
    logger.info({ productId }, 'Product successfully deleted from Google Merchant');
  } catch (err: any) {
    // If product wasn't found on Merchant Center, ignore error
    if (err.status === 404) {
      logger.info({ productId }, 'Product not found on Google Merchant Center during deletion, skipping.');
    } else {
      logger.error({ err, productId }, 'Failed to delete product from Google Merchant Center');
      throw err;
    }
  }
}

/**
 * Syncs all active, non-deleted products to Google Merchant Center.
 */
export async function syncAllProducts(): Promise<{ synced: number; errors: number }> {
  const productList = (await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.is_deleted, false),
        eq(products.status, 'active'),
      ),
    )) as MerchantProduct[];

  let synced = 0;
  let errors = 0;

  for (const product of productList) {
    try {
      await syncProduct(product);
      synced++;
    } catch (err) {
      logger.error({ err, productId: product.id }, 'Failed to sync product in bulk catalog sync');
      errors++;
    }
  }

  logger.info({ synced, errors }, 'Google Merchant bulk catalog sync complete');
  return { synced, errors };
}

/**
 * Generates an RSS 2.0 product feed XML.
 */
export async function generateProductFeed(): Promise<string> {
  const productList = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.is_deleted, false),
        eq(products.status, 'active'),
      ),
    );

  const apiRootUrl = env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:4000/api

  const items = productList
    .map((p) => {
      const imageUrl = p.primary_image_path
        ? `${apiRootUrl}${p.primary_image_path}`
        : '';
      const productUrl = `${env.FRONTEND_URL}/products/${p.slug}`;
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
    <link>${escapeXml(env.FRONTEND_URL)}</link>
    <description>JDM Engines and Transmissions</description>
${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
