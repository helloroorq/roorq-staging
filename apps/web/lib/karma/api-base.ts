/**
 * Public URL of the Fastify karma API (browser + server).
 * Use NEXT_PUBLIC_KARMA_API_URL (e.g. http://127.0.0.1:4000) in development.
 */
export const getKarmaApiBaseUrl = (): string => {
  const fromPublic = process.env.NEXT_PUBLIC_KARMA_API_URL
  if (fromPublic && fromPublic.length > 0) {
    return fromPublic.replace(/\/$/, '')
  }
  if (process.env.KARMA_API_URL && process.env.KARMA_API_URL.length > 0) {
    return process.env.KARMA_API_URL.replace(/\/$/, '')
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:4000'
  }
  return ''
}
