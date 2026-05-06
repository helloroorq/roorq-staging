import type { ReactNode } from 'react'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Test Connection',
  description: 'Internal connectivity checks for Roorq.',
  path: '/test-connection',
  noIndex: true,
})

export default function TestConnectionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
