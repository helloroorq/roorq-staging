'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  ShoppingBag,
  Store,
  User as UserIcon,
  X,
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { useAuth } from '@/components/providers/AuthProvider'
import DesktopMegaMenu from '@/components/navbar/DesktopMegaMenu'
import MobileMenuSection from '@/components/navbar/MobileMenuSection'
import { CATEGORY_MENUS, type CategoryMenu } from '@/components/navbar/menu-data'

type CartItem = { quantity?: number }
type CategoryMenuId = CategoryMenu['id']

const focusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

const buildAuthHref = (mode: 'signin' | 'signup', pathname: string) => {
  const params = new URLSearchParams()
  params.set('mode', mode)
  params.set('redirect', pathname === '/auth' ? '/' : pathname)
  return `/auth?${params.toString()}`
}

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto hidden max-w-[1880px] lg:block">
        <div className="flex h-[74px] items-center gap-8 px-6 xl:px-8">
          <div className="h-8 w-28 rounded bg-stone-100" />
          <div className="h-12 flex-1 rounded-full border border-stone-200 bg-stone-50" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded border border-stone-200 bg-stone-50" />
            <div className="h-10 w-32 rounded bg-slate-950" />
            <div className="h-10 w-28 rounded border border-stone-200 bg-stone-50" />
          </div>
        </div>
        <div className="h-14 border-t border-black/10" />
      </div>
      <div className="px-4 py-3 lg:hidden">
        <div className="flex h-10 items-center justify-between">
          <div className="h-10 w-10 rounded border border-stone-200 bg-stone-50" />
          <div className="h-8 w-24 rounded bg-stone-100" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded border border-stone-200 bg-stone-50" />
            <div className="h-10 w-10 rounded border border-stone-200 bg-stone-50" />
          </div>
        </div>
        <div className="mt-3 h-11 rounded-full border border-stone-200 bg-stone-50" />
      </div>
    </header>
  )
}

type UserMenuProps = {
  userEmail: string
  isAdmin: boolean
  isSeller: boolean
  authLoading: boolean
  isOpen: boolean
  onLogout: () => void
}

function DesktopUserMenu({ userEmail, isAdmin, isSeller, authLoading, isOpen, onLogout }: UserMenuProps) {
  if (!isOpen) return null
  return (
    <div
      role="menu"
      className="absolute right-0 top-[calc(100%+14px)] z-[70] w-72 overflow-hidden rounded-[26px] border border-stone-200 bg-white shadow-[0_30px_60px_rgba(15,23,42,0.14)]"
    >
      {authLoading ? (
        <div className="px-5 py-4 text-sm text-stone-500">Checking session...</div>
      ) : (
        <>
          <div className="border-b border-stone-100 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Signed in</p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-950">{userEmail}</p>
          </div>
          <div className="p-2">
            {isAdmin && (
              <Link href="/admin" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 ${focusRingClass}`}>
                <LayoutDashboard className="h-4 w-4" />
                Admin dashboard
              </Link>
            )}
            {isSeller && (
              <Link href="/seller" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 ${focusRingClass}`}>
                <Store className="h-4 w-4" />
                Seller dashboard
              </Link>
            )}
            <Link href="/profile" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 ${focusRingClass}`}>
              <UserIcon className="h-4 w-4" />
              My profile
            </Link>
            <Link href="/messages" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 ${focusRingClass}`}>
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link href="/orders" className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-stone-50 ${focusRingClass}`}>
              <Package className="h-4 w-4" />
              My orders
            </Link>
          </div>
          <div className="border-t border-stone-100 p-2">
            <button type="button" onClick={onLogout} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 ${focusRingClass}`}>
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function NavbarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userRole, userType, loading: authLoading, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [activeMegaMenuId, setActiveMegaMenuId] = useState<CategoryMenuId | null>(null)
  const [lastMegaMenuId, setLastMegaMenuId] = useState<CategoryMenuId | null>(null)
  const [expandedMobileMenuId, setExpandedMobileMenuId] = useState<CategoryMenuId | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const menuCloseTimeoutRef = useRef<number | null>(null)
  const triggerRefs = useRef<Partial<Record<CategoryMenuId, HTMLButtonElement | null>>>({})

  const currentPath = pathname || '/'
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSeller = userType === 'vendor' || isAdmin
  const sellHref = isSeller ? '/seller' : '/sell'
  const loginHref = buildAuthHref('signin', currentPath)
  const signupHref = buildAuthHref('signup', currentPath)
  const topIconButtonClass = `inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-900 transition hover:bg-stone-100 ${focusRingClass}`

  useEffect(() => {
    if (activeMegaMenuId) setLastMegaMenuId(activeMegaMenuId)
  }, [activeMegaMenuId])
  useEffect(() => setSearchQuery(searchParams?.get('search') ?? ''), [searchParams])
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[]
        setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0))
      } catch (error) {
        logger.error('Error reading cart', error instanceof Error ? error : undefined)
        setCartCount(0)
      }
    }
    const handleStorageChange = (event: StorageEvent) => event.key === 'cart' && updateCartCount()
    updateCartCount()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', updateCartCount)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false)
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(target)) setActiveMegaMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
    setExpandedMobileMenuId(null)
    setActiveMegaMenuId(null)
  }, [currentPath, searchParams])
  useEffect(() => {
    return () => {
      if (menuCloseTimeoutRef.current) {
        window.clearTimeout(menuCloseTimeoutRef.current)
      }
    }
  }, [])

  const activeNavLabel = useMemo(() => {
    const gender = searchParams?.get('gender')
    const category = searchParams?.get('category')
    return CATEGORY_MENUS.find((item) => item.match.pathname === currentPath || item.match.gender === gender || item.match.category === category)?.label ?? null
  }, [currentPath, searchParams])

  const displayedMegaMenuItem = useMemo(() => {
    const itemId = activeMegaMenuId ?? lastMegaMenuId
    return CATEGORY_MENUS.find((item) => item.id === itemId) ?? null
  }, [activeMegaMenuId, lastMegaMenuId])

  const clearMenuCloseTimeout = () => {
    if (menuCloseTimeoutRef.current) {
      window.clearTimeout(menuCloseTimeoutRef.current)
      menuCloseTimeoutRef.current = null
    }
  }
  const openMegaMenu = (itemId: CategoryMenuId) => {
    clearMenuCloseTimeout()
    setIsUserMenuOpen(false)
    setActiveMegaMenuId(itemId)
  }
  const scheduleMegaMenuClose = () => {
    clearMenuCloseTimeout()
    menuCloseTimeoutRef.current = window.setTimeout(() => setActiveMegaMenuId(null), 140)
  }
  const closeMegaMenu = (focusTriggerId?: CategoryMenuId) => {
    clearMenuCloseTimeout()
    setActiveMegaMenuId(null)
    if (focusTriggerId) window.requestAnimationFrame(() => triggerRefs.current[focusTriggerId]?.focus())
  }
  const moveTriggerFocus = (currentId: CategoryMenuId, direction: 'next' | 'prev') => {
    const currentIndex = CATEGORY_MENUS.findIndex((item) => item.id === currentId)
    const nextIndex = (currentIndex + (direction === 'next' ? 1 : -1) + CATEGORY_MENUS.length) % CATEGORY_MENUS.length
    const nextItem = CATEGORY_MENUS[nextIndex]
    triggerRefs.current[nextItem.id]?.focus()
    openMegaMenu(nextItem.id)
  }
  const handleTriggerKeyDown = (itemId: CategoryMenuId, event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); openMegaMenu(itemId); return
    }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveTriggerFocus(itemId, 'next'); return }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveTriggerFocus(itemId, 'prev'); return }
    if (event.key === 'Escape') { event.preventDefault(); closeMegaMenu(itemId) }
  }
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    const normalizedQuery = searchQuery.trim()
    if (normalizedQuery) params.set('search', normalizedQuery)
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
    setIsMenuOpen(false)
  }
  const handleLogout = async () => {
    try { await signOut() } catch (error) { logger.error('Logout error', error instanceof Error ? error : undefined) }
    setIsUserMenuOpen(false)
    router.replace('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1880px]">
        <div className="flex h-16 items-center gap-3 px-4 lg:hidden">
          <button type="button" onClick={() => { setIsMenuOpen(true); setIsUserMenuOpen(false); closeMegaMenu() }} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white hover:bg-stone-50 ${focusRingClass}`} aria-label="Open navigation menu"><Menu className="h-5 w-5" /></button>
          <Link href="/" className={focusRingClass}><span className="block text-[1.9rem] font-black tracking-[-0.08em] text-[#e11d2e]">roorq</span></Link>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/cart" className={topIconButtonClass} aria-label="Open cart"><div className="relative"><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-semibold text-white">{cartCount > 99 ? '99+' : cartCount}</span>}</div></Link>
            <Link href={user ? '/profile' : loginHref} className={topIconButtonClass} aria-label={user ? 'Open profile' : 'Log in'}><UserIcon className="h-5 w-5" /></Link>
          </div>
        </div>

        <div className="border-t border-black/10 px-4 py-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 rounded-full border border-slate-900 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]" role="search">
            <Search className="h-4 w-4 text-stone-500" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder='Search for "white linen trousers"' className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-stone-400" aria-label="Search listings" />
          </form>
        </div>

        <div className="hidden lg:block">
          <div className="flex h-[74px] items-center gap-8 px-6 xl:px-8">
            <Link href="/" className={focusRingClass}><span className="block text-[2.15rem] font-black tracking-[-0.08em] text-[#e11d2e]">roorq</span></Link>
            <form onSubmit={handleSearchSubmit} className="flex flex-1" role="search">
              <div className="mx-auto flex w-full max-w-[840px] items-center gap-3 rounded-full border border-slate-900 bg-white px-5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <Search className="h-5 w-5 text-stone-500" />
                <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder='Search for "white linen trousers"' className="w-full bg-transparent text-[1.05rem] text-slate-900 outline-none placeholder:text-stone-400" aria-label="Search listings" />
                <button type="submit" className="sr-only">Search</button>
              </div>
            </form>
            <div className="ml-auto flex shrink-0 items-center gap-1 xl:gap-2">
              {user && <Link href="/messages" className={topIconButtonClass} aria-label="Open messages"><MessageSquare className="h-5 w-5" /></Link>}
              <Link href="/cart" className={topIconButtonClass} aria-label="Open cart"><div className="relative"><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-semibold text-white">{cartCount > 99 ? '99+' : cartCount}</span>}</div></Link>
              <Link href={sellHref} className={`inline-flex h-10 items-center rounded-sm bg-slate-950 px-5 text-[1rem] font-semibold text-white hover:bg-slate-800 ${focusRingClass}`}>{isSeller ? 'Seller hub' : 'Sell now'}</Link>
              {!user ? (
                <>
                  <Link href={signupHref} className={`inline-flex h-10 items-center rounded-sm border border-slate-900 px-5 text-[1rem] font-semibold text-slate-900 hover:bg-stone-50 ${focusRingClass}`}>Sign up</Link>
                  <Link href={loginHref} className={`px-3 text-[1rem] font-semibold text-slate-900 hover:text-slate-600 ${focusRingClass}`}>Log in</Link>
                </>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button type="button" onClick={() => { setIsUserMenuOpen((value) => !value); closeMegaMenu() }} className={`inline-flex h-10 items-center gap-2 rounded-sm px-2.5 text-sm font-semibold text-slate-900 hover:bg-stone-50 ${focusRingClass}`} aria-label="Open account menu" aria-expanded={isUserMenuOpen} aria-haspopup="menu">
                    <UserIcon className="h-4.5 w-4.5" />
                    <ChevronDown className={`h-4 w-4 transition ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <DesktopUserMenu userEmail={user.email ?? 'Signed in'} isAdmin={isAdmin} isSeller={isSeller} authLoading={authLoading} isOpen={isUserMenuOpen} onLogout={() => void handleLogout()} />
                </div>
              )}
            </div>
          </div>

          <div ref={desktopMenuRef} className="relative border-t border-black/10" onMouseEnter={clearMenuCloseTimeout} onMouseLeave={scheduleMegaMenuClose} onFocusCapture={clearMenuCloseTimeout} onBlurCapture={(event) => { const nextTarget = event.relatedTarget as Node | null; if (!nextTarget || !event.currentTarget.contains(nextTarget)) scheduleMegaMenuClose() }}>
            <nav className="flex h-14 items-center gap-10 px-6 xl:px-8" aria-label="Marketplace categories">
              {CATEGORY_MENUS.map((item) => {
                const isOpen = activeMegaMenuId === item.id
                const isActive = isOpen || activeNavLabel === item.label
                return (
                  <button
                    key={item.id}
                    ref={(element) => { triggerRefs.current[item.id] = element }}
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={`mega-menu-panel-${item.id}`}
                    onMouseEnter={() => openMegaMenu(item.id)}
                    onFocus={() => openMegaMenu(item.id)}
                    onClick={() => { setActiveMegaMenuId((current) => current === item.id ? null : item.id); setIsUserMenuOpen(false) }}
                    onKeyDown={(event) => handleTriggerKeyDown(item.id, event)}
                    className={`group relative inline-flex h-full items-center text-[1.03rem] font-semibold tracking-[-0.01em] ${item.accent === 'sale' ? (isActive ? 'text-[#e11d48]' : 'text-[#e11d48] hover:text-[#be123c]') : (isActive ? 'text-slate-950' : 'text-slate-900 hover:text-slate-600')} ${focusRingClass}`}
                  >
                    {item.label}
                    <span className={`absolute inset-x-0 bottom-[-1px] h-0.5 origin-left transition ${isActive ? (item.accent === 'sale' ? 'scale-x-100 bg-[#e11d48]' : 'scale-x-100 bg-slate-950') : 'scale-x-0 bg-slate-950 group-hover:scale-x-100'}`} />
                  </button>
                )
              })}
            </nav>
            {displayedMegaMenuItem && <DesktopMegaMenu menu={displayedMegaMenuItem} isOpen={Boolean(activeMegaMenuId)} onClose={() => closeMegaMenu()} onEscape={() => closeMegaMenu(displayedMegaMenuItem.id)} />}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" aria-label="Close navigation menu" onClick={() => setIsMenuOpen(false)} />
          <div className="relative ml-auto flex h-full w-[88%] max-w-sm flex-col overflow-y-auto bg-white shadow-[-18px_0_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Marketplace menu</p><p className="mt-1 text-[2rem] font-black tracking-[-0.08em] text-[#e11d2e]">roorq</p></div>
              <button type="button" onClick={() => setIsMenuOpen(false)} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white ${focusRingClass}`} aria-label="Close navigation menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="border-b border-black/10 px-5 py-5">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 rounded-full border border-slate-900 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <Search className="h-4 w-4 text-stone-500" />
                <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder='Search for "white linen trousers"' className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-stone-400" aria-label="Search listings" />
              </form>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href={sellHref} className={`inline-flex items-center justify-center rounded-sm bg-slate-950 px-4 py-3 text-sm font-semibold text-white ${focusRingClass}`}>{isSeller ? 'Seller hub' : 'Sell now'}</Link>
                <Link href={user ? '/profile' : signupHref} className={`inline-flex items-center justify-center rounded-sm border border-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 ${focusRingClass}`}>{user ? 'My profile' : 'Sign up'}</Link>
              </div>
            </div>
            <div className="flex-1 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Browse</p>
              <div className="mt-4 space-y-3">
                {CATEGORY_MENUS.map((item) => (
                  <MobileMenuSection key={item.id} menu={item} isExpanded={expandedMobileMenuId === item.id} onToggle={() => setExpandedMobileMenuId((current) => current === item.id ? null : item.id)} onNavigate={() => setIsMenuOpen(false)} />
                ))}
              </div>
              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Account</p>
                <div className="mt-4 space-y-2">
                  {user ? (
                    <>
                      {isAdmin && <Link href="/admin" className={`flex items-center justify-between rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-600 ${focusRingClass}`}>Admin dashboard<ArrowRight className="h-4 w-4" /></Link>}
                      {isSeller && <Link href="/seller" className={`flex items-center justify-between rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 ${focusRingClass}`}>Seller dashboard<ArrowRight className="h-4 w-4 text-stone-500" /></Link>}
                      <Link href="/messages" className={`flex items-center justify-between rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 ${focusRingClass}`}>Messages<ArrowRight className="h-4 w-4 text-stone-500" /></Link>
                      <Link href="/orders" className={`flex items-center justify-between rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 ${focusRingClass}`}>Orders<ArrowRight className="h-4 w-4 text-stone-500" /></Link>
                      <button type="button" onClick={() => { setIsMenuOpen(false); void handleLogout() }} className={`flex w-full items-center justify-between rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4 text-left text-sm font-semibold text-rose-600 ${focusRingClass}`}>Log out<LogOut className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <Link href={loginHref} className={`flex items-center justify-between rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 ${focusRingClass}`}>Log in<ArrowRight className="h-4 w-4 text-stone-500" /></Link>
                      <Link href={signupHref} className={`flex items-center justify-between rounded-[22px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 ${focusRingClass}`}>Sign up<ArrowRight className="h-4 w-4 text-stone-500" /></Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default function Navbar() {
  return <Suspense fallback={<NavbarFallback />}><NavbarContent /></Suspense>
}
