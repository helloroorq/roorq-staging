const DEFAULT_REDIRECT = '/'
const ALLOWED_PREFIXES = [
  '/',
  '/shop',
  '/checkout',
  '/profile',
  '/orders',
  '/admin',
  '/drops',
  '/products',
  '/cart',
]

const isAllowedRedirect = (path: string) =>
  ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

export const sanitizeRedirectPath = (redirect: string | null, origin?: string) => {
  if (!redirect) {
    return DEFAULT_REDIRECT
  }

  try {
    if (redirect.startsWith('http')) {
      if (!origin) {
        return DEFAULT_REDIRECT
      }
      const url = new URL(redirect)
      if (url.origin !== origin) {
        return DEFAULT_REDIRECT
      }
      const combined = `${url.pathname}${url.search}${url.hash}`
      return isAllowedRedirect(combined) ? combined : DEFAULT_REDIRECT
    }

    if (!redirect.startsWith('/')) {
      return DEFAULT_REDIRECT
    }

    if (!isAllowedRedirect(redirect)) {
      return DEFAULT_REDIRECT
    }

    return redirect
  } catch {
    return DEFAULT_REDIRECT
  }
}
