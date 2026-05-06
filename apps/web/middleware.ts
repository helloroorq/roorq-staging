import { NextResponse, type NextRequest } from 'next/server'

const IDLE_TIMEOUT_SECONDS = 7 * 24 * 60 * 60
const LAST_SEEN_REFRESH_SECONDS = 5 * 60
const SUPABASE_COOKIE_MARKERS = ['sb-', '-auth-token']

const buildFingerprint = async (ip: string, userAgent: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${ip}|${userAgent}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const isSupabaseSessionCookie = (name: string) =>
  SUPABASE_COOKIE_MARKERS.some((marker) => name.startsWith(marker) || name.includes(marker))

const clearSupabaseCookies = (request: NextRequest, response: NextResponse) => {
  request.cookies
    .getAll()
    .filter((cookie) => isSupabaseSessionCookie(cookie.name))
    .forEach((cookie) => {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
    })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/') || pathname.startsWith('/auth')) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  const hasSessionCookie = request.cookies.getAll().some((cookie) => isSupabaseSessionCookie(cookie.name))
  if (!hasSessionCookie) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const now = Date.now()
  const lastSeenRaw = request.cookies.get('auth_last_seen')?.value
  const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : null

  if (lastSeen && Number.isFinite(lastSeen)) {
    const idleSeconds = Math.floor((now - lastSeen) / 1000)
    if (idleSeconds > IDLE_TIMEOUT_SECONDS) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      redirectUrl.searchParams.set('error', 'session_expired')

      const expiredResponse = NextResponse.redirect(redirectUrl)
      clearSupabaseCookies(request, expiredResponse)
      expiredResponse.cookies.set('auth_last_seen', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
      expiredResponse.cookies.set('auth_fingerprint', '', {
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
      return expiredResponse
    }
  }

  const shouldRefreshLastSeen =
    !lastSeen || !Number.isFinite(lastSeen) || (now - (lastSeen || 0)) / 1000 > LAST_SEEN_REFRESH_SECONDS

  if (shouldRefreshLastSeen) {
    response.cookies.set('auth_last_seen', `${now}`, {
      maxAge: IDLE_TIMEOUT_SECONDS,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const fingerprint = await buildFingerprint(ip, userAgent)
  const storedFingerprint = request.cookies.get('auth_fingerprint')?.value

  if (storedFingerprint && storedFingerprint !== fingerprint) {
    response.cookies.set('auth_suspicious', '1', {
      maxAge: 60 * 60,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
  } else if (!storedFingerprint) {
    response.cookies.set('auth_fingerprint', fingerprint, {
      maxAge: IDLE_TIMEOUT_SECONDS,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
