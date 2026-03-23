import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()
  const privatePaths = [
    '/admin',
    '/api',
    '/auth',
    '/cart',
    '/checkout',
    '/messages',
    '/orders',
    '/profile',
    '/referrals',
    '/signup',
    '/test-connection',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/shop', '/products/', '/stores/', '/about', '/contact', '/faq'],
        disallow: privatePaths,
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
