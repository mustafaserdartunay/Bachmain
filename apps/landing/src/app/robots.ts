import type { MetadataRoute } from 'next'
import { SITE_URL } from '../seo/site'

export const dynamic = 'force-static'

/**
 * robots.txt — Search + AI crawlers welcome on public content.
 * Auth / password flows stay disallowed. Bing/Google use sitemap + host.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/giris',
          '/uye-ol',
          '/login',
          '/register',
          '/sifremi-unuttum',
          '/sifre-sifirla',
          '/api/',
          '/features/crm',
          '/features/erp',
          '/features/stock',
          '/features/finance',
          '/features/reports',
          '/modules/production',
          '/modules/field-sales',
          '/modules/ecommerce',
          '/e-invoice',
          '/pricing',
          '/login',
          '/register',
          '/contact',
        ],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
