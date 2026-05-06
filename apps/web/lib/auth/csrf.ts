import { NextRequest } from 'next/server'

type CsrfCheck = { ok: true } | { ok: false; error: string }

export const getCsrfCookie = (request: NextRequest) =>
  request.cookies.get('auth_csrf')?.value ?? null

export const validateCsrfToken = (request: NextRequest, token?: string | null): CsrfCheck => {
  const cookie = getCsrfCookie(request)

  if (!token || !cookie || token !== cookie) {
    return { ok: false, error: 'Invalid CSRF token.' }
  }

  return { ok: true }
}
