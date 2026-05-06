'use client'

import { Suspense, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/nav/BottomNav'
import TopNav from '@/components/nav/TopNav'

const shouldHideCustomerNav = (pathname: string) =>
  pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/seller')

function TopNavFallback() {
  return <div aria-hidden="true" className="sticky top-0 z-40 h-14 border-b border-[#e5e5e5] bg-white md:h-16" />
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const shouldShowCustomerNav = !shouldHideCustomerNav(pathname)
  const shouldReserveBottomNavSpace = shouldShowCustomerNav

  return (
    <>
      {shouldShowCustomerNav ? (
        <Suspense fallback={<TopNavFallback />}>
          <TopNav />
        </Suspense>
      ) : null}
      <main className={shouldReserveBottomNavSpace ? 'min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : 'min-h-screen'}>
        {children}
      </main>
      <BottomNav />
    </>
  )
}
