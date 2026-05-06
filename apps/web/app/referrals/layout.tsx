import type { ReactNode } from 'react'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Referrals',
  description: 'Invite friends and manage referral rewards.',
  path: '/referrals',
  noIndex: true,
})

export default function ReferralsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
