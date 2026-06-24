import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { products, blogPosts } from '../models/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '../config/env';
import { generateProductFeed } from '../services/merchantService';

const router = Router();

// GET /sitemap.xml
router.get('/sitemap.xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseUrl = env.FRONTEND_URL;

    const [productRows, blogRows] = await Promise.all([
      db
        .select({ slug: products.slug, updated_at: products.updated_at })
        .from(products)
        .where(and(eq(products.is_deleted, false), eq(products.status, 'active'))),
      db
        .select({ slug: blogPosts.slug, updated_at: blogPosts.updated_at })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published')),
    ]);

    interface SitemapUrl {
      loc: string;
      priority: string;
      changefreq: string;
      lastmod?: string;
    }

    const staticUrls: SitemapUrl[] = [
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
      .map(
        (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

// GET /feed/products.xml — Google Merchant product feed
router.get('/feed/products.xml', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feed = await generateProductFeed();
    res.header('Content-Type', 'application/xml');
    res.send(feed);
  } catch (err) {
    next(err);
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
