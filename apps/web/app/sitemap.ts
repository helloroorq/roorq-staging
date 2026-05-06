import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://www.roorq.com'
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('updated_at', { ascending: false })

  const { data: stores } = await supabase
    .from('users')
    .select('id, updated_at')
    .eq('user_type', 'vendor')
    .eq('vendor_status', 'approved')
    .order('updated_at', { ascending: false })

  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/shop`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...(products ?? []).map((product) => ({
      url: `${siteUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(stores ?? []).map((store) => ({
      url: `${siteUrl}/stores/${store.id}`,
      lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
