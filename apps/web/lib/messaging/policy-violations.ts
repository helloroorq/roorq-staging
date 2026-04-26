import 'server-only'

import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { hashMessageForPolicy } from '@/lib/messaging/message-hash'

const VIOLATION_WINDOW_DAYS = 7
const VIOLATION_THRESHOLD = 3

export { hashMessageForPolicy }

export async function recordPolicyViolation(input: {
  userId: string
  matchedPattern: string
  rawMessage: string
}): Promise<void> {
  const admin = getAdminClient()
  if (!admin) {
    logger.warn('[policy] No admin client; violation not persisted', { userId: input.userId })
    return
  }

  const raw_message_hash = hashMessageForPolicy(input.rawMessage)

  const { error: insertError } = await admin.from('policy_violations').insert({
    user_id: input.userId,
    matched_pattern: input.matchedPattern,
    raw_message_hash,
  })

  if (insertError) {
    logger.error('[policy] Failed to insert violation', { message: insertError.message })
    return
  }

  const since = new Date()
  since.setDate(since.getDate() - VIOLATION_WINDOW_DAYS)

  const { count, error: countError } = await admin
    .from('policy_violations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .gte('created_at', since.toISOString())

  if (countError || count === null) {
    return
  }

  if (count >= VIOLATION_THRESHOLD) {
    const { error: flagError } = await admin
      .from('users')
      .update({ messaging_flagged_for_review_at: new Date().toISOString() })
      .eq('id', input.userId)

    if (flagError) {
      logger.error('[policy] Failed to flag user for review', { message: flagError.message })
    }
  }
}
