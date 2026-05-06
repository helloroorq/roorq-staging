import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/auth/rate-limit'
import { logAuthEvent } from '@/lib/auth/audit'
import { sanitizeRedirectPath } from '@/lib/auth/redirects'
import { validateCsrfToken } from '@/lib/auth/csrf'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  redirect: z.string().optional(),
  csrf: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || null

  let payload: z.infer<typeof RequestSchema>
  try {
    payload = RequestSchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf ?? null)
  if (!csrfCheck.ok) {
    await logAuthEvent({
      identifier: payload.email,
      action: 'account_recovery',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: csrfCheck.error },
    })
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const rate = await applyRateLimit({
    identifier: payload.email,
    type: 'otp_recovery',
    maxAttempts: 3,
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
    increment: 1,
  })

  if (!rate.allowed) {
    await logAuthEvent({
      identifier: payload.email,
      action: 'account_recovery',
      status: 'blocked',
      ip,
      userAgent,
      metadata: { retryAfter: rate.retryAfter },
    })
    return NextResponse.json(
      { error: 'Too many recovery requests. Please try again later.' },
      { status: 429, headers: rate.retryAfter ? { 'Retry-After': `${rate.retryAfter}` } : undefined }
    )
  }

  const supabase = await createClient()
  const origin = new URL(request.url).origin
  const candidateRedirect = sanitizeRedirectPath(payload.redirect ?? '/', origin)
  const redirectPath = candidateRedirect.startsWith('/profile') ? '/' : candidateRedirect
  const callbackParams = new URLSearchParams()
  callbackParams.set('redirect', redirectPath)
  callbackParams.set('recovery', '1')
  if (payload.csrf) callbackParams.set('csrf', payload.csrf)
  const emailRedirectTo = `${origin}/auth/callback?${callbackParams.toString()}`

  const { error } = await supabase.auth.signInWithOtp({
    email: payload.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  })

  if (error) {
    await logAuthEvent({
      identifier: payload.email,
      action: 'account_recovery',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: error.message },
    })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await logAuthEvent({
    identifier: payload.email,
    action: 'account_recovery',
    status: 'success',
    ip,
    userAgent,
  })

  return NextResponse.json({ success: true })
}
