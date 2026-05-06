import * as Sentry from '@sentry/nextjs'

export function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV

  const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1')
  const debugEnabled = process.env.SENTRY_DEBUG === 'true'

  const release =
    process.env.SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    undefined

  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    environment,
    release,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    debug: debugEnabled,
  })
}
