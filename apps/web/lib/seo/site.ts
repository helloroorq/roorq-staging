import { publicEnv } from '@/lib/env.public'

const DEFAULT_SITE_URL = 'https://www.roorq.com'

const normalizeUrl = (value: string) => value.replace(/\/+$/, '')

export const getSiteUrl = () => {
  const raw = publicEnv.NEXT_PUBLIC_SITE_URL
  if (!raw) {
    return DEFAULT_SITE_URL
  }

  try {
    const url = new URL(raw)
    return normalizeUrl(url.origin)
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const absoluteUrl = (path: string) => new URL(path, getSiteUrl()).toString()
