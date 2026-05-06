export type CookieConsent = 'all' | 'essential' | null

export const COOKIE_CONSENT_EVENT = 'cookie-consent'

const COOKIE_NAME = 'roorq_cookie_consent'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365

const readCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}

export const setCookieConsent = (accepted: boolean): void => {
  if (typeof document === 'undefined') return

  const value = accepted ? 'all' : 'essential'
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

export const getCookieConsent = (): CookieConsent => {
  const value = readCookieValue(COOKIE_NAME)

  if (value === 'all' || value === 'essential') {
    return value
  }

  return null
}

export const hasConsent = (): boolean => getCookieConsent() === 'all'
