import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = 'https://www.roorq.com'
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
        allow: ['/', '/shop', '/products/', '/stores/'],
        disallow: privatePaths,
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
