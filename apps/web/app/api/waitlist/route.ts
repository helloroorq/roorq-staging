import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/auth/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const SignupSchema = z.object({
  email: z.string().email().max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s\-]{6,18}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  instagram: z
    .string()
    .trim()
    .max(40)
    .regex(/^@?[A-Za-z0-9._]{1,30}$/, 'Enter a valid Instagram handle')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  iitrRoll: z
    .string()
    .trim()
    .regex(/^\d{6,9}$/, 'Roll should be 6–9 digits')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  referrerCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{6,10}$/i)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  source: z.string().trim().max(40).optional(),
})

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateReferralCode(): string {
  const bytes = crypto.randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i += 1) {
    out += REFERRAL_ALPHABET[bytes[i]! % REFERRAL_ALPHABET.length]
  }
  return out
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? request.ip ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  const rateLimit = await applyRateLimit({
    identifier: ip,
    type: 'drop_001_waitlist',
    maxAttempts: 8,
    windowSeconds: 600,
    blockSeconds: 1800,
    increment: 1,
  })

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many signups from this IP. Try again in a bit.' },
      { status: 429 }
    )
    if (rateLimit.retryAfter) response.headers.set('Retry-After', String(rateLimit.retryAfter))
    return response
  }

  let payload: z.infer<typeof SignupSchema>
  try {
    payload = SignupSchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const admin = getAdminClient()
  if (!admin) {
    logger.error('drop_001_waitlist: SUPABASE_SERVICE_ROLE_KEY missing')
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const email = payload.email.trim().toLowerCase()
  const userAgent = request.headers.get('user-agent') ?? null
  const instagram = payload.instagram?.replace(/^@/, '') ?? null
  const referrerCode = payload.referrerCode?.toUpperCase() ?? null

  // Idempotent: if email already exists, return their existing referral code.
  const existing = await admin
    .from('drop_001_waitlist')
    .select('referral_code')
    .eq('email', email)
    .maybeSingle()

  if (existing.data?.referral_code) {
    return NextResponse.json({
      success: true,
      alreadyJoined: true,
      referralCode: existing.data.referral_code,
    })
  }

  // Insert with retry on unlikely referral_code collision (8 chars over 32 alphabet ≈ 1e12 space).
  let referralCode = generateReferralCode()
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await admin
      .from('drop_001_waitlist')
      .insert({
        email,
        phone: payload.phone ?? null,
        instagram,
        iitr_roll: payload.iitrRoll ?? null,
        referral_code: referralCode,
        referrer_code: referrerCode,
        source: payload.source ?? null,
        ip_address: ip === 'unknown' ? null : ip,
        user_agent: userAgent,
      })
      .select('referral_code')
      .single()

    if (!error && data) {
      return NextResponse.json({
        success: true,
        alreadyJoined: false,
        referralCode: data.referral_code,
      })
    }

    // 23505 = unique_violation (collision on referral_code or email race)
    if (error?.code === '23505' && error.message?.includes('referral_code')) {
      referralCode = generateReferralCode()
      continue
    }

    if (error?.code === '23505' && error.message?.includes('email')) {
      const fallback = await admin
        .from('drop_001_waitlist')
        .select('referral_code')
        .eq('email', email)
        .maybeSingle()
      if (fallback.data?.referral_code) {
        return NextResponse.json({
          success: true,
          alreadyJoined: true,
          referralCode: fallback.data.referral_code,
        })
      }
    }

    logger.error('drop_001_waitlist insert failed', {
      code: error?.code,
      message: error?.message,
    })
    return NextResponse.json({ error: 'Could not join the waitlist. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Could not generate a referral code. Try again.' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const ref = url.searchParams.get('ref')

  const [{ data: total }, refCount] = await Promise.all([
    supabase.rpc('drop_001_waitlist_count'),
    ref
      ? supabase.rpc('drop_001_waitlist_referrer_count', { code: ref.toUpperCase() })
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({
    total: typeof total === 'number' ? total : 0,
    referrerCount: typeof refCount.data === 'number' ? refCount.data : null,
  })
}
