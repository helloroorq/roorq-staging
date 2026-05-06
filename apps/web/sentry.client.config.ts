import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
  process.env.SENTRY_ENVIRONMENT ||
  process.env.NODE_ENV

const tracesSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ||
    process.env.SENTRY_TRACES_SAMPLE_RATE ||
    '0.1'
)

const debugEnabled =
  process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true' ||
  process.env.SENTRY_DEBUG === 'true'

const release =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  process.env.SENTRY_RELEASE ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
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
