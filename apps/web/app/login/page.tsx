import { redirect } from 'next/navigation'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Login',
  description: 'Sign in to your Roorq account.',
  path: '/login',
  noIndex: true,
})

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string; ref?: string } }) {
  const params = new URLSearchParams()
  if (searchParams.redirect) {
    params.set('redirect', searchParams.redirect)
  }
  if (searchParams.ref) {
    params.set('ref', searchParams.ref)
  }

  redirect(`/auth?${params.toString()}`)
}
