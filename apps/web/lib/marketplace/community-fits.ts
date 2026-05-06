import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunityFit } from '@/components/home/HomeCommunityFits'
import { logger } from '@/lib/logger'

type ReviewRow = {
  id: string
  rating: number | null
  review_photos: string[] | null
  user_id: string | null
  vendor_id: string | null
  created_at: string
}

const RATIO_CYCLE: Array<CommunityFit['ratio']> = ['4:5', '3:4', '4:5', '4:5', '3:4', '4:5', '3:4', '4:5']

/**
 * Build the homepage Community Fits grid from real review photos.
 * Returns [] when nothing exists, so the homepage hides the section instead of seeding fakes.
 */
export async function fetchHomeCommunityFits(
  supabase: SupabaseClient
): Promise<CommunityFit[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_reviews')
      .select('id, rating, review_photos, user_id, vendor_id, created_at')
      .not('review_photos', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      logger.warn('fetchHomeCommunityFits: supabase error', { message: error.message })
      return []
    }

    const rows = (data ?? []) as ReviewRow[]
    const fits: CommunityFit[] = []

    for (const row of rows) {
      const photo = row.review_photos?.[0]
      if (!photo) {
        continue
      }
      fits.push({
        id: row.id,
        username: 'roorq',
        href: '/community',
        image: photo,
        alt: 'Community fit photo',
        ratio: RATIO_CYCLE[fits.length % RATIO_CYCLE.length] ?? '4:5',
        likes: Math.max(1, Math.round((row.rating ?? 5) * 4)),
      })
    }

    return fits
  } catch (cause) {
    logger.warn(
      'fetchHomeCommunityFits: unexpected failure',
      cause instanceof Error ? { message: cause.message } : undefined
    )
    return []
  }
}
