import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyRouteHandlerCookies, createRouteHandlerClient } from '@/lib/supabase/route'
import { applyRateLimit, clearRateLimit } from '@/lib/auth/rate-limit'
import { logAuthEvent } from '@/lib/auth/audit'
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
  token: z.string().min(4),
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
      action: 'otp_verify',
      status: 'failed',
      ip,
      userAgent,
      metadata: { message: csrfCheck.error },
    })
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const checkLimit = await applyRateLimit({
    identifier,
    type: 'otp_verify',
    maxAttempts: 5,
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60,
    increment: 0,
  })

  if (!checkLimit.allowed) {
    await logAuthEvent({
      identifier,
      action: 'otp_verify',
      status: 'blocked',
      ip,
      userAgent,
      metadata: { retryAfter: checkLimit.retryAfter },
    })
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: checkLimit.retryAfter ? { 'Retry-After': `${checkLimit.retryAfter}` } : undefined }
    )
  }

  const { supabase, cookiesToSet } = createRouteHandlerClient(request)
  const { error } =
    payload.method === 'email'
      ? await supabase.auth.verifyOtp({
          email: payload.email,
          token: payload.token,
          type: 'email',
        })
      : await supabase.auth.verifyOtp({
          phone: payload.phone,
          token: payload.token,
          type: 'sms',
        })

  if (error) {
    const failure = await applyRateLimit({
      identifier,
      type: 'otp_verify',
      maxAttempts: 5,
      windowSeconds: 15 * 60,
      blockSeconds: 15 * 60,
      increment: 1,
    })

    await logAuthEvent({
      identifier,
      action: 'otp_verify',
      status: failure.allowed ? 'failed' : 'blocked',
      ip,
      userAgent,
      metadata: { message: error.message },
    })

    return NextResponse.json(
      { error: error.message || 'Invalid code.' },
      {
        status: failure.allowed ? 400 : 429,
        headers: failure.retryAfter ? { 'Retry-After': `${failure.retryAfter}` } : undefined,
      }
    )
  }

  await clearRateLimit(identifier, 'otp_verify')
  await logAuthEvent({
    identifier,
    action: 'otp_verify',
    status: 'success',
    ip,
    userAgent,
  })

  const response = NextResponse.json({ success: true })
  return applyRouteHandlerCookies(response, cookiesToSet)
}
