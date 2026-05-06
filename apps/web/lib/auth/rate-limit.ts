import { getAdminClient } from '@/lib/supabase/admin'

type RateLimitConfig = {
  identifier: string
  type: string
  maxAttempts: number
  windowSeconds: number
  blockSeconds: number
  increment: number
}

export type RateLimitResult = {
  allowed: boolean
  retryAfter: number | null
}

type RateLimitRow = {
  id: string
  identifier: string
  limit_type: string
  count: number
  reset_at: string
  blocked_until: string | null
}

const inMemoryLimits = new Map<string, RateLimitRow>()

const getKey = (identifier: string, type: string) => `${type}:${identifier}`

const nowIso = () => new Date().toISOString()

const getNow = () => new Date()

const diffSeconds = (futureIso: string) => {
  const future = new Date(futureIso).getTime()
  const now = Date.now()
  return Math.max(0, Math.ceil((future - now) / 1000))
}

const applyRateLimitToRow = (
  row: RateLimitRow | null,
  config: RateLimitConfig
): { row: RateLimitRow; allowed: boolean; retryAfter: number | null } => {
  const now = getNow()
  const resetAt = row ? new Date(row.reset_at) : null
  let count = row?.count ?? 0
  let blockedUntil = row?.blocked_until ? new Date(row.blocked_until) : null

  if (blockedUntil && blockedUntil > now) {
    return {
      row: row!,
      allowed: false,
      retryAfter: diffSeconds(row!.blocked_until as string),
    }
  }

  if (!resetAt || resetAt <= now) {
    count = 0
  }

  const nextCount = count + config.increment
  let allowed = true
  let retryAfter: number | null = null
  let nextBlockedUntil: Date | null = null
  let nextResetAt = resetAt && resetAt > now ? resetAt : new Date(now.getTime() + config.windowSeconds * 1000)

  if (nextCount > config.maxAttempts) {
    allowed = false
    nextBlockedUntil = new Date(now.getTime() + config.blockSeconds * 1000)
    retryAfter = Math.ceil((nextBlockedUntil.getTime() - now.getTime()) / 1000)
  }

  const nextRow: RateLimitRow = {
    id: row?.id ?? '',
    identifier: config.identifier,
    limit_type: config.type,
    count: allowed ? nextCount : nextCount,
    reset_at: nextResetAt.toISOString(),
    blocked_until: nextBlockedUntil ? nextBlockedUntil.toISOString() : null,
  }

  return { row: nextRow, allowed, retryAfter }
}

export async function applyRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const adminClient = getAdminClient()
  const key = getKey(config.identifier, config.type)

  if (!adminClient) {
    const existing = inMemoryLimits.get(key) ?? null
    const { row, allowed, retryAfter } = applyRateLimitToRow(existing, config)
    inMemoryLimits.set(key, row)
    return { allowed, retryAfter }
  }

  const { data: existingRows, error } = await adminClient
    .from('auth_rate_limits')
    .select('*')
    .eq('identifier', config.identifier)
    .eq('limit_type', config.type)
    .limit(1)

  if (error) {
    return { allowed: true, retryAfter: null }
  }

  const existing = existingRows?.[0] as RateLimitRow | undefined
  const { row, allowed, retryAfter } = applyRateLimitToRow(existing ?? null, config)

  const payload = {
    identifier: row.identifier,
    limit_type: row.limit_type,
    count: row.count,
    reset_at: row.reset_at,
    blocked_until: row.blocked_until,
    updated_at: nowIso(),
  }

  if (existing?.id) {
    await adminClient.from('auth_rate_limits').update(payload).eq('id', existing.id)
  } else {
    await adminClient.from('auth_rate_limits').insert({
      ...payload,
      created_at: nowIso(),
    })
  }

  return { allowed, retryAfter }
}

export async function clearRateLimit(identifier: string, type: string) {
  const adminClient = getAdminClient()
  const key = getKey(identifier, type)

  if (!adminClient) {
    inMemoryLimits.delete(key)
    return
  }

  await adminClient
    .from('auth_rate_limits')
    .delete()
    .eq('identifier', identifier)
    .eq('limit_type', type)
}
