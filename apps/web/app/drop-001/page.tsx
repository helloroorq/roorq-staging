import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { buildMetadata } from '@/lib/seo/metadata'
import Drop001Client from './Drop001Client'

export const metadata = buildMetadata({
  title: 'Drop 001 — IIT Roorkee',
  description:
    'ROORQ Drop 001 lands May 13. Limited pieces, story-scored, IITR-first. Join the early access list and bring two friends to unlock priority access.',
  path: '/drop-001',
  keywords: ['roorq', 'iit roorkee', 'drop 001', 'thrift', 'vintage', 'campus drop'],
})

// Drop time: 8:00 PM IST, May 13 2026 = 14:30 UTC.
const DROP_AT_UTC = '2026-05-13T14:30:00.000Z'

type Props = {
  searchParams: { ref?: string }
}

async function loadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('drop_001_waitlist_count')
    if (error) throw error
    return typeof data === 'number' ? data : 0
  } catch (cause) {
    logger.warn(
      'drop-001: count fetch failed; rendering fallback',
      cause instanceof Error ? { message: cause.message } : undefined
    )
    return 0
  }
}

export default async function Drop001Page({ searchParams }: Props) {
  const initialCount = await loadCount()
  const referrerCode = searchParams.ref?.match(/^[A-Za-z0-9]{6,10}$/)?.[0]?.toUpperCase() ?? null

  return (
    <Drop001Client
      dropAtUtc={DROP_AT_UTC}
      initialCount={initialCount}
      referrerCode={referrerCode}
    />
  )
}
