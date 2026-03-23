import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchApprovedStoresByIds } from '@/lib/marketplace/public'
import { getSiteUrl } from '@/lib/seo/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const supabase = await createClient()

  const staticRoutes = [
    '/',
    '/shop',
    '/drops',
    '/editorial',
    '/events',
    '/faq',
    '/about',
    '/contact',
    '/locations',
    '/membership',
    '/mystery-box',
    '/sizing',
    '/terms',
    '/privacy',
    '/returns-policy',
    '/shipping-policy',
    '/wholesale',
  ]

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, vendor_id')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  const vendorIds = Array.from(
    new Set((products ?? []).map((product) => product.vendor_id).filter(Boolean))
  )

  const stores = await fetchApprovedStoresByIds(vendorIds)

  const productRoutes = (products ?? []).map((product) => ({
    url: `${siteUrl}/products/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const storeRoutes = stores
    .filter((store) => store.store_name || store.business_name)
    .map((store) => ({
      url: `${siteUrl}/stores/${store.id}`,
      lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    }))

  const staticEntries = staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? ('daily' as const) : ('weekly' as const),
    priority: path === '/' ? 1 : 0.6,
  }))

  return [...staticEntries, ...productRoutes, ...storeRoutes]
}
