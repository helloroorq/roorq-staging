import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/auth/rate-limit'
import { getResendClient, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { serverEnv } from '@/lib/env.server'

export const runtime = 'nodejs'

const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  message: z.string().min(10).max(2000),
  captchaToken: z.string().min(5),
})

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }
  return request.headers.get('x-real-ip') ?? request.ip ?? 'unknown'
}

const verifyTurnstile = async (token: string, ip: string) => {
  const secret = serverEnv.TURNSTILE_SECRET_KEY
  if (!secret) {
    return { ok: false, error: 'Captcha misconfigured' }
  }

  const body = new URLSearchParams()
  body.set('secret', secret)
  body.set('response', token)
  if (ip && ip !== 'unknown') {
    body.set('remoteip', ip)
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = (await response.json().catch(() => null)) as { success?: boolean }
  return payload?.success ? { ok: true } : { ok: false, error: 'Captcha verification failed' }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = await applyRateLimit({
    identifier: ip,
    type: 'contact_form',
    maxAttempts: 5,
    windowSeconds: 600,
    blockSeconds: 1800,
    increment: 1,
  })

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    if (rateLimit.retryAfter) {
      response.headers.set('Retry-After', String(rateLimit.retryAfter))
    }
    return response
  }

  let payload: z.infer<typeof ContactSchema>
  try {
    payload = ContactSchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const captchaResult = await verifyTurnstile(payload.captchaToken, ip)
  if (!captchaResult.ok) {
    return NextResponse.json({ error: captchaResult.error || 'Captcha failed' }, { status: 400 })
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json({ error: 'Email service unavailable' }, { status: 503 })
  }

  const inbox = serverEnv.CONTACT_INBOX_EMAIL || 'support@roorq.com'
  const name = normalizeText(payload.name)
  const email = payload.email.trim().toLowerCase()
  const message = normalizeText(payload.message)

  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [inbox],
      replyTo: email,
      subject: `Contact form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nIP: ${ip}\n\nMessage:\n${message}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
