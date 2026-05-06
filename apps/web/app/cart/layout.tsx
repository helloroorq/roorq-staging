import type { ReactNode } from 'react'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Cart',
  description: 'Review items in your cart before checkout.',
  path: '/cart',
  noIndex: true,
})

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
