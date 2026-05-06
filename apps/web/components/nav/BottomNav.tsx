'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart, Home, LayoutGrid, Plus, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { readWishlistCount, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

const shouldHideCustomerNav = (pathname: string) =>
  pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/seller')

const getAvatarLabel = (email: string | null | undefined, fullName: string | null | undefined) => {
  const source = (fullName && fullName.trim()) || (email && email.trim()) || 'R'
  return source.charAt(0).toUpperCase()
}

export default function BottomNav() {
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    const syncWishlistCount = () => setWishlistCount(readWishlistCount())

    syncWishlistCount()
    window.addEventListener('storage', syncWishlistCount)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount as EventListener)

    return () => {
      window.removeEventListener('storage', syncWishlistCount)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount as EventListener)
    }
  }, [])

  if (shouldHideCustomerNav(pathname)) {
    return null
  }

  const profileLabel = getAvatarLabel(
    user?.email,
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null
  )

  const tabs: Array<{
    badge?: number
    href: string
    icon: typeof Home
    isCenter?: boolean
    label: string
  }> = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: LayoutGrid },
    { label: 'SELL', href: '/sell', icon: Plus, isCenter: true },
    { label: 'Saved', href: '/saved', icon: Heart, badge: wishlistCount },
    { label: 'Profile', href: '/profile', icon: UserIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-100 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      <div className="grid min-h-[4.25rem] grid-cols-5 pb-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-end gap-1.5 pb-0.5 text-[11px] font-medium text-black"
              >
                <span className="mt-[-16px] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.24)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pb-0.5 tracking-[0.16em]">{tab.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 text-[11px] transition ${
                isActive ? 'font-medium text-black' : 'text-neutral-400'
              }`}
            >
              <span className="relative flex h-5 items-center justify-center">
                {tab.href === '/profile' && user ? (
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isActive ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {profileLabel}
                  </span>
                ) : (
                  <Icon className={`h-5 w-5 ${isActive ? 'fill-current stroke-[1.75]' : ''}`} />
                )}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
