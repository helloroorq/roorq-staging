'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, Heart, LogOut, Menu, MessageSquare, Package, ShoppingBag, Sparkles, Store, User as UserIcon } from 'lucide-react'
import DesktopMegaMenu from '@/components/navbar/DesktopMegaMenu'
import { CATEGORY_MENUS } from '@/components/navbar/menu-data'
import RoorqLogo from '@/components/RoorqLogo'
import MobileSidebar from '@/components/nav/MobileSidebar'
import MessagesNotificationBell from '@/components/nav/MessagesNotificationBell'
import SearchBar from '@/components/nav/SearchBar'
import { useAuth } from '@/components/providers/AuthProvider'
import KarmaBalancePill from '@/components/karma/KarmaBalancePill'
import { useKarma } from '@/hooks/useKarma'
import { logger } from '@/lib/logger'
import { readWishlistCount, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

type NavLink = {
  label: string
  href: string
}

type SearchParamReader = {
  entries(): IterableIterator<[string, string]>
  get(name: string): string | null
} | null

type CategoryMenuId = (typeof CATEGORY_MENUS)[number]['id']

const CART_STORAGE_KEY = 'cart'

const PRIMARY_LINKS: NavLink[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'Drops', href: '/drops' },
  { label: 'Sell', href: '/sell' },
]

const CATEGORY_LINKS: NavLink[] = CATEGORY_MENUS.map((menu) => ({ label: menu.label, href: menu.href }))

const shouldHideCustomerNav = (pathname: string) =>
  pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/seller')

const buildAuthHref = (mode: 'signin' | 'signup', pathname: string) => {
  const params = new URLSearchParams()
  params.set('mode', mode)
  params.set('redirect', pathname === '/auth' ? '/' : pathname)
  return `/auth?${params.toString()}`
}

const readCartCount = () => {
  if (typeof window === 'undefined') {
    return 0
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY)
    const parsedValue = storedValue ? JSON.parse(storedValue) : []

    if (!Array.isArray(parsedValue)) {
      return 0
    }

    return parsedValue.reduce((total, entry) => {
      const quantity = Number(entry?.quantity ?? 1)
      return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1)
    }, 0)
  } catch {
    return 0
  }
}

const getAvatarLabel = (user: User | null) => {
  const source =
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    user?.email ||
    'R'
  return source.trim().charAt(0).toUpperCase()
}

const isPrimaryLinkActive = (currentPath: string, href: string) =>
  currentPath === href || (href !== '/' && currentPath.startsWith(href))

const isCategoryLinkActive = (href: string, pathname: string, searchParams: SearchParamReader) => {
  const targetUrl = new URL(href, 'https://roorq.local')

  if (pathname !== targetUrl.pathname) {
    return false
  }

  const targetEntries = Array.from(targetUrl.searchParams.entries())
  if (targetEntries.length === 0) {
    return Array.from(searchParams?.entries() ?? []).length === 0
  }

  return targetEntries.every(([key, value]) => searchParams?.get(key) === value)
}

function DesktopUserMenu({
  authLoading,
  isAdmin,
  isOpen,
  isSeller,
  onLogout,
  user,
}: {
  authLoading: boolean
  isAdmin: boolean
  isOpen: boolean
  isSeller: boolean
  onLogout: () => Promise<void>
  user: User | null
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-3xl border border-neutral-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
      {authLoading ? (
        <div className="px-4 py-3 text-sm text-neutral-500">Checking session...</div>
      ) : (
        <>
          <div className="border-b border-neutral-100 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Signed in</p>
            <p className="mt-2 truncate text-sm font-semibold text-black">{user?.email ?? 'Roorq member'}</p>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <Package className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/karma"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <Sparkles className="h-4 w-4" />
              Karma credits
            </Link>
            {isSeller ? (
              <Link
                href={isAdmin ? '/admin' : '/seller'}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
              >
                <Store className="h-4 w-4" />
                {isAdmin ? 'Admin' : 'Seller hub'}
              </Link>
            ) : null}
          </div>

          <div className="border-t border-neutral-100 pt-2">
            <button
              type="button"
              onClick={() => {
                void onLogout()
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function TopNav() {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loading: authLoading, signOut, user, userRole, userType } = useAuth()
  const { snapshot: karmaSnapshot } = useKarma()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [openMegaMenuId, setOpenMegaMenuId] = useState<CategoryMenuId | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const megaMenuCloseTimerRef = useRef<number | null>(null)
  const megaMenuRegionRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const handleCloseMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((current) => {
      if (current) {
        window.requestAnimationFrame(() => {
          menuButtonRef.current?.focus()
        })
      }
      return false
    })
  }, [])

  useEffect(() => {
    const syncWishlistCount = () => setWishlistCount(readWishlistCount())
    const syncCartCount = () => setCartCount(readCartCount())

    syncWishlistCount()
    syncCartCount()
    window.addEventListener('storage', syncWishlistCount)
    window.addEventListener('storage', syncCartCount)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount as EventListener)
    window.addEventListener('cartUpdated', syncCartCount as EventListener)

    return () => {
      window.removeEventListener('storage', syncWishlistCount)
      window.removeEventListener('storage', syncCartCount)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount as EventListener)
      window.removeEventListener('cartUpdated', syncCartCount as EventListener)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', isMobileSidebarOpen)

    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isMobileSidebarOpen])

  useEffect(() => {
    handleCloseMobileSidebar()
    setIsUserMenuOpen(false)
    setOpenMegaMenuId(null)
  }, [handleCloseMobileSidebar, pathname, searchParams])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }

      if (megaMenuRegionRef.current && !megaMenuRegionRef.current.contains(event.target as Node)) {
        setOpenMegaMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(
    () => () => {
      if (megaMenuCloseTimerRef.current !== null) {
        window.clearTimeout(megaMenuCloseTimerRef.current)
      }
    },
    []
  )

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSeller = userType === 'vendor' || isAdmin
  const loginHref = buildAuthHref('signin', pathname)
  const signupHref = buildAuthHref('signup', pathname)
  const avatarLabel = useMemo(() => getAvatarLabel(user), [user])

  if (shouldHideCustomerNav(pathname)) {
    return null
  }

  const clearMegaMenuCloseTimer = () => {
    if (megaMenuCloseTimerRef.current !== null) {
      window.clearTimeout(megaMenuCloseTimerRef.current)
      megaMenuCloseTimerRef.current = null
    }
  }

  const openMegaMenu = (menuId: CategoryMenuId) => {
    clearMegaMenuCloseTimer()
    setOpenMegaMenuId(menuId)
  }

  const closeMegaMenu = () => {
    clearMegaMenuCloseTimer()
    setOpenMegaMenuId(null)
  }

  const scheduleMegaMenuClose = () => {
    clearMegaMenuCloseTimer()
    megaMenuCloseTimerRef.current = window.setTimeout(() => {
      setOpenMegaMenuId(null)
      megaMenuCloseTimerRef.current = null
    }, 140)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      handleCloseMobileSidebar()
      setIsUserMenuOpen(false)
      router.replace('/')
      router.refresh()
    } catch (error) {
      logger.error('Logout error', error instanceof Error ? error : undefined)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto max-w-[1840px]">
          <div className="relative flex h-14 w-full items-center px-4 md:h-16 md:px-6 lg:px-8">
            <div className="flex shrink-0 items-center md:mr-6">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-black md:hidden"
                aria-label="Open navigation menu"
                aria-expanded={isMobileSidebarOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" aria-label="Roorq home" className="hidden shrink-0 md:block">
                <RoorqLogo className="h-8 w-auto text-black" />
              </Link>
            </div>

            <Link
              href="/"
              aria-label="Roorq home"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden"
            >
              <RoorqLogo className="h-6 w-auto text-black" />
            </Link>

            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:ml-0 md:justify-center md:gap-6">
              <div className="hidden min-w-0 max-w-2xl flex-1 md:block">
                <SearchBar className="w-full" variant="desktop" />
              </div>

              <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
                <Link
                  href="/cart"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-black md:h-11 md:w-11"
                  aria-label="Open cart"
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                  {cartCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white md:right-1 md:top-1">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href={user ? '/profile' : loginHref}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-black md:hidden"
                  aria-label={user ? 'Open profile' : 'Log in'}
                >
                  {user ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
                      {avatarLabel}
                    </span>
                  ) : (
                    <UserIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  )}
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                  {user ? <MessagesNotificationBell /> : null}
                  {user ? <KarmaBalancePill balance={karmaSnapshot?.balance ?? null} /> : null}
                  {user ? (
                    <Link
                      href="/saved"
                      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                      aria-label="Open saved items"
                    >
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 ? (
                        <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                          {wishlistCount > 99 ? '99+' : wishlistCount}
                        </span>
                      ) : null}
                    </Link>
                  ) : null}
                </div>

                {!user ? (
                  <div className="hidden items-center gap-3 md:flex">
                    <Link
                      href={signupHref}
                      className="inline-flex h-10 items-center rounded-md border border-black px-5 text-[15px] font-semibold text-black transition hover:bg-neutral-100"
                    >
                      Sign up
                    </Link>
                    <Link
                      href={loginHref}
                      className="inline-flex h-10 items-center px-1 text-[15px] font-semibold text-black transition hover:text-neutral-600"
                    >
                      Log in
                    </Link>
                  </div>
                ) : (
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
                      className="inline-flex h-10 items-center gap-2 rounded-full pl-1 pr-2 text-sm text-black transition hover:bg-neutral-100"
                      aria-expanded={isUserMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                        {avatarLabel}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-neutral-500 transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <DesktopUserMenu
                      authLoading={authLoading}
                      isAdmin={isAdmin}
                      isOpen={isUserMenuOpen}
                      isSeller={isSeller}
                      onLogout={handleLogout}
                      user={user}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#e5e5e5] px-4 py-3 md:hidden">
            <SearchBar className="w-full" variant="mobile" />
          </div>

          <div
            ref={megaMenuRegionRef}
            className="relative hidden md:block"
            onMouseEnter={clearMegaMenuCloseTimer}
            onMouseLeave={scheduleMegaMenuClose}
            onBlur={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return
              }
              closeMegaMenu()
            }}
          >
            <nav
              className="flex h-11 items-center gap-x-8 gap-y-2 border-t border-[#e5e5e5] px-6 text-[15px] lg:px-8"
              aria-label="Category strip"
            >
              {CATEGORY_MENUS.map((menu) => {
                const isActive = isCategoryLinkActive(menu.href, pathname, searchParams)
                const isOpen = openMegaMenuId === menu.id

                return (
                  <Link
                    key={menu.id}
                    href={menu.href}
                    onMouseEnter={() => openMegaMenu(menu.id)}
                    onFocus={() => openMegaMenu(menu.id)}
                    onClick={closeMegaMenu}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        openMegaMenu(menu.id)
                      } else if (event.key === 'Escape') {
                        closeMegaMenu()
                      }
                    }}
                    aria-controls={`mega-menu-panel-${menu.id}`}
                    aria-expanded={isOpen}
                    className={`inline-flex h-full items-center border-b-2 transition ${
                      menu.accent === 'sale'
                        ? `font-medium ${isActive ? 'border-rose-900 text-rose-900' : 'border-transparent text-rose-900 hover:border-rose-900/40'}`
                        : isActive
                          ? 'border-black font-medium text-black'
                          : 'border-transparent text-black hover:border-black/30'
                    }`}
                  >
                    {menu.label}
                  </Link>
                )
              })}
            </nav>

            {CATEGORY_MENUS.map((menu) => (
              <DesktopMegaMenu
                key={menu.id}
                menu={menu}
                isOpen={openMegaMenuId === menu.id}
                onClose={closeMegaMenu}
                onEscape={closeMegaMenu}
              />
            ))}
          </div>
        </div>
      </header>

      <MobileSidebar
        authLoading={authLoading}
        categoryLinks={CATEGORY_LINKS}
        currentPath={pathname}
        loginHref={loginHref}
        onClose={handleCloseMobileSidebar}
        onLogout={handleLogout}
        open={isMobileSidebarOpen}
        primaryLinks={PRIMARY_LINKS}
        signupHref={signupHref}
        user={user}
        userRole={userRole}
        userType={userType}
      />
    </>
  )
}
