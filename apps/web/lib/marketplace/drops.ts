import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DropCard } from '@/components/home/HomeDropRail'
import { logger } from '@/lib/logger'

type ProductRow = {
  id: string
  name: string
  price: number | null
  images: string[] | null
  hero_image: string | null
  hero_position: number | null
  created_at: string
}

const FALLBACK_DROP_IMAGE = '/drops/drop-001.svg'

/**
 * Build the homepage drop rail from real product data.
 * - Returns [] when there are no approved products yet, so the homepage hides the rail
 *   instead of showing seeded fakes.
 * - For now we expose a single "Latest" drop card derived from the most recent products;
 *   when a `drops` table is added we can group by drop_id without changing the UI.
 */
export async function fetchHomeDrops(supabase: SupabaseClient): Promise<DropCard[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, images, hero_image, hero_position, created_at')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      logger.warn('fetchHomeDrops: supabase error', { message: error.message })
      return []
    }

    const products = (data ?? []) as ProductRow[]
    if (products.length === 0) {
      return []
    }

    const prices = products.map((p) => Number(p.price ?? 0)).filter((n) => n > 0)
    const priceMin = prices.length ? Math.min(...prices) : 0
    const priceMax = prices.length ? Math.max(...prices) : 0
    const cover = products[0]?.hero_image ?? products[0]?.images?.[0] ?? FALLBACK_DROP_IMAGE

    // 24h ending window for the curated drop card; reset on each ISR revalidate.
    const endsAtMs = Date.now() + 1000 * 60 * 60 * 24

    return [
      {
        id: 'latest-edit',
        name: 'Latest edit',
        href: '/shop?sort=newest',
        image: cover,
        status: 'live',
        endsAtMs,
        priceMin,
        priceMax,
        likes: products.length,
      },
    ]
  } catch (cause) {
    logger.warn(
      'fetchHomeDrops: unexpected failure',
      cause instanceof Error ? { message: cause.message } : undefined
    )
    return []
  }
}
