"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const env_1 = require("../config/env");
const merchantService_1 = require("../services/merchantService");
const router = (0, express_1.Router)();
// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const baseUrl = env_1.env.FRONTEND_URL;
        const [productRows, blogRows] = await Promise.all([
            database_1.db
                .select({ slug: schema_1.products.slug, updated_at: schema_1.products.updated_at })
                .from(schema_1.products)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false), (0, drizzle_orm_1.eq)(schema_1.products.status, 'active'))),
            database_1.db
                .select({ slug: schema_1.blogPosts.slug, updated_at: schema_1.blogPosts.updated_at })
                .from(schema_1.blogPosts)
                .where((0, drizzle_orm_1.eq)(schema_1.blogPosts.status, 'published')),
        ]);
        const staticUrls = [
            { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
            { loc: `${baseUrl}/products`, priority: '0.9', changefreq: 'daily' },
            { loc: `${baseUrl}/blog`, priority: '0.7', changefreq: 'weekly' },
            { loc: `${baseUrl}/about`, priority: '0.5', changefreq: 'monthly' },
            { loc: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
        ];
        const productUrls = productRows.map((p) => ({
            loc: `${baseUrl}/products/${p.slug}`,
            lastmod: p.updated_at.split('T')[0],
            priority: '0.8',
            changefreq: 'weekly',
        }));
        const blogUrls = blogRows.map((b) => ({
            loc: `${baseUrl}/blog/${b.slug}`,
            lastmod: b.updated_at.split('T')[0],
            priority: '0.6',
            changefreq: 'monthly',
        }));
        const allUrls = [...staticUrls, ...productUrls, ...blogUrls];
        const urlElements = allUrls
            .map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`)
            .join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (err) {
        next(err);
    }
});
// GET /feed/products.xml — Google Merchant product feed
router.get('/feed/products.xml', async (req, res, next) => {
    try {
        const feed = await (0, merchantService_1.generateProductFeed)();
        res.header('Content-Type', 'application/xml');
        res.send(feed);
    }
    catch (err) {
        next(err);
    }
});
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
exports.default = router;
//# sourceMappingURL=seo.js.map