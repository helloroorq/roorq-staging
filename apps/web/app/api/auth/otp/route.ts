import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/auth/rate-limit'
import { logAuthEvent } from '@/lib/auth/audit'
import { sanitizeRedirectPath } from '@/lib/auth/redirects'
import { validateCsrfToken } from '@/lib/auth/csrf'

export const runtime = 'nodejs'

const EmailSchema = z.string().email().transform((value) => value.trim().toLowerCase())

const PhoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine(
    (value) => value.length === 10 || (value.length === 12 && value.startsWith('91')),
    'Invalid phone number'
  )
  .transform((value) => (value.length === 10 ? `+91${value}` : `+${value}`))

const BaseSchema = z.object({
  mode: z.enum(['signin', 'signup']),
  redirect: z.string().optional(),
  ref: z.string().optional(),
  csrf: z.string().optional(),
})

const EmailRequestSchema = BaseSchema.extend({
  method: z.literal('email'),
  email: EmailSchema,
})

const PhoneRequestSchema = BaseSchema.extend({
  method: z.literal('phone'),
  phone: PhoneSchema,
})

const RequestSchema = z.discriminatedUnion('method', [EmailRequestSchema, PhoneRequestSchema])

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

  const identifier = payload.method === 'email' ? payload.email : payload.phone
  const csrfCheck = validateCsrfToken(request, payload.csrf ?? null)
  if (!csrfCheck.ok) {
    await logAuthEvent({
      identifier,
      action: 'otp_request',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: csrfCheck.error },
    })
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const rate = await applyRateLimit({
    identifier,
    type: 'otp_request',
    maxAttempts: 3,
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
    increment: 1,
  })

  if (!rate.allowed) {
    await logAuthEvent({
      identifier,
      action: 'otp_request',
      status: 'blocked',
      ip,
      userAgent,
      metadata: { retryAfter: rate.retryAfter },
    })
    return NextResponse.json(
      { error: 'Too many OTP requests. Please try again later.' },
      { status: 429, headers: rate.retryAfter ? { 'Retry-After': `${rate.retryAfter}` } : undefined }
    )
  }

  const supabase = await createClient()
  const origin = new URL(request.url).origin
  const candidateRedirect = sanitizeRedirectPath(payload.redirect ?? '/', origin)
  const redirectPath = candidateRedirect.startsWith('/profile') ? '/' : candidateRedirect
  const callbackParams = new URLSearchParams()
  callbackParams.set('redirect', redirectPath)
  if (payload.ref) callbackParams.set('ref', payload.ref)
  if (payload.csrf) callbackParams.set('csrf', payload.csrf)
  const emailRedirectTo = `${origin}/auth/callback?${callbackParams.toString()}`

  const { error } =
    payload.method === 'email'
      ? await supabase.auth.signInWithOtp({
          email: payload.email,
          options: {
            shouldCreateUser: payload.mode === 'signup',
            emailRedirectTo,
          },
        })
      : await supabase.auth.signInWithOtp({
          phone: payload.phone,
          options: {
            shouldCreateUser: payload.mode === 'signup',
          },
        })

  if (error) {
    await logAuthEvent({
      identifier,
      action: 'otp_request',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: error.message },
    })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await logAuthEvent({
    identifier,
    action: 'otp_request',
    status: 'success',
    ip,
    userAgent,
  })

  return NextResponse.json({ success: true })
}
