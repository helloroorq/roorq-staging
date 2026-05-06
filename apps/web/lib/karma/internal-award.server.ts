import 'server-only'
import { getAwardDelta, type KarmaAwardReason } from '@roorq/karma'
import { optionalServerEnv } from '@/lib/env.server'

export const internalKarmaAward = async (params: {
  userId: string
  reason: KarmaAwardReason
  referenceId: string
}): Promise<void> => {
  const base = optionalServerEnv('KARMA_API_URL')
  const key = optionalServerEnv('KARMA_INTERNAL_API_KEY')
  if (!base || !key) {
    // eslint-disable-next-line no-console
    console.warn('KARMA: skip award — KARMA_API_URL or KARMA_INTERNAL_API_KEY not set')
    return
  }
  const delta = getAwardDelta(params.reason)
  const res = await fetch(`${base.replace(/\/$/, '')}/api/karma/award`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': key,
    },
    body: JSON.stringify({
      userId: params.userId,
      reason: params.reason,
      referenceId: params.referenceId,
      delta,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Karma award failed: ${res.status} ${err}`)
  }
}
