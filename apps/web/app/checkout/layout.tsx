import type { ReactNode } from 'react'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Checkout',
  description: 'Secure checkout for Roorq orders.',
  path: '/checkout',
  noIndex: true,
})

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
