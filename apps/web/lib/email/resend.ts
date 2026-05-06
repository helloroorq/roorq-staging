import 'server-only'

import { Resend } from 'resend'
import { serverEnv } from '@/lib/env.server'

export const RESEND_FROM_EMAIL = 'onboarding@resend.dev'

export const getResendClient = (): Resend | null => {
  const apiKey = serverEnv.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}
