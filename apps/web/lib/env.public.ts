const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
const NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const NEXT_PUBLIC_SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
const NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
const NEXT_PUBLIC_GA_ID = process.env.NEXT_PUBLIC_GA_ID
const NEXT_PUBLIC_TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const NEXT_PUBLIC_KARMA_API_URL = process.env.NEXT_PUBLIC_KARMA_API_URL

if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing required public environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required public environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_KARMA_API_URL,
}

export const getAppEnv = (): 'development' | 'staging' | 'production' => {
  const rawEnv = (NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development').toLowerCase()
  if (rawEnv === 'production') {
    return 'production'
  }
  if (rawEnv === 'staging') {
    return 'staging'
  }
  return 'development'
}
