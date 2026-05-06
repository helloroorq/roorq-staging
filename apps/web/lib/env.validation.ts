import 'server-only'

import { publicEnv } from './env.public'
import { serverEnv } from './env.server'
import { logger } from './logger'

export type AppEnv = 'development' | 'staging' | 'production'

const normalizeAppEnv = (value: string | undefined): AppEnv => {
  const raw = (value ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development').toLowerCase()
  if (raw === 'preview') {
    return 'staging'
  }
  if (raw === 'development' || raw === 'staging' || raw === 'production') {
    return raw
  }
  throw new Error(`Invalid APP_ENV value: ${raw}`)
}

export const getAppEnv = (): AppEnv => normalizeAppEnv(process.env.APP_ENV)

export type EnvValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
  appEnv: AppEnv
}

let hasReported = false

const reportEnvValidation = (result: EnvValidationResult): void => {
  if (hasReported) {
    return
  }
  hasReported = true

  if (result.warnings.length > 0) {
    logger.warn(`[env] Warnings (${result.appEnv}): ${result.warnings.join(' | ')}`)
  } else {
    logger.info(`[env] Validation OK (${result.appEnv})`)
  }
}

export const validateEnv = (): EnvValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  const appEnv = getAppEnv()

  try {
    void publicEnv.NEXT_PUBLIC_SUPABASE_URL
    void publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Missing required public environment variables.')
  }

  if (appEnv === 'production' && !publicEnv.NEXT_PUBLIC_SITE_URL) {
    warnings.push('NEXT_PUBLIC_SITE_URL is not set; canonical URLs may be incorrect.')
  }

  const {
    MAILCHIMP_API_KEY,
    MAILCHIMP_AUDIENCE_ID,
    RESEND_API_KEY,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY,
    SENTRY_DSN,
    SENTRY_TRACES_SAMPLE_RATE,
    TURNSTILE_SECRET_KEY,
    CONTACT_INBOX_EMAIL,
  } = serverEnv

  if ((MAILCHIMP_API_KEY && !MAILCHIMP_AUDIENCE_ID) || (!MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID)) {
    errors.push('MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID must be set together.')
  }

  if (MAILCHIMP_API_KEY && !MAILCHIMP_API_KEY.includes('-')) {
    warnings.push('MAILCHIMP_API_KEY format looks unusual; expected "<key>-<dc>".')
  }

  if (appEnv === 'production' && !RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required in production for order notifications.')
  } else if (appEnv === 'staging' && !RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY is not set; email notifications will be disabled.')
  }

  if ((RAZORPAY_KEY_ID && !RAZORPAY_KEY_SECRET) || (!RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)) {
    errors.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set together.')
  }

  if (RAZORPAY_KEY_ID && !RAZORPAY_WEBHOOK_SECRET) {
    warnings.push('RAZORPAY_WEBHOOK_SECRET is not set; webhook signature verification will fail.')
  }

  if (!publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    warnings.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set; contact form captcha will be disabled.')
  }

  if (!TURNSTILE_SECRET_KEY) {
    warnings.push('TURNSTILE_SECRET_KEY is not set; captcha verification will be skipped.')
  }

  if (!CONTACT_INBOX_EMAIL) {
    warnings.push('CONTACT_INBOX_EMAIL is not set; contact form will default to support@roorq.com.')
  }

  if ((appEnv === 'staging' || appEnv === 'production') && !SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not set; server-side admin operations may fail.')
  }

  const sentryDsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN || SENTRY_DSN
  if (appEnv === 'production' && !sentryDsn) {
    warnings.push('Sentry DSN is not set; error monitoring will be disabled in production.')
  }

  if (SENTRY_TRACES_SAMPLE_RATE) {
    const sampleRate = Number(SENTRY_TRACES_SAMPLE_RATE)
    if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
      warnings.push('SENTRY_TRACES_SAMPLE_RATE must be a number between 0 and 1.')
    }
  }

  return { ok: errors.length === 0, errors, warnings, appEnv }
}

export const assertValidEnv = (): void => {
  const result = validateEnv()
  reportEnvValidation(result)
  if (!result.ok) {
    throw new Error(`Environment validation failed: ${result.errors.join(' | ')}`)
  }
}
