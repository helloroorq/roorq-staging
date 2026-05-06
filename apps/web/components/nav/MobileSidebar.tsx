'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { Heart, LogOut, MessageSquare, Package, ShoppingBag, Store, X, User as UserIcon } from 'lucide-react'
import RoorqLogo from '@/components/RoorqLogo'

type NavLink = {
  label: string
  href: string
}

type MobileSidebarProps = {
  authLoading: boolean
  categoryLinks: NavLink[]
  currentPath: string
  loginHref: string
  onClose: () => void
  onLogout: () => Promise<void>
  open: boolean
  primaryLinks: NavLink[]
  signupHref: string
  user: User | null
  userRole: string | null
  userType: string | null
}

const isActivePath = (currentPath: string, href: string) => {
  const targetUrl = new URL(href, 'https://roorq.local')
  return currentPath === targetUrl.pathname
}

const getAvatarLabel = (user: User | null) => {
  const candidate =
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    user?.email ||
    'R'
  return candidate.trim().charAt(0).toUpperCase()
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function MobileSidebar({
  authLoading,
  categoryLinks,
  currentPath,
  loginHref,
  onClose,
  onLogout,
  open,
  primaryLinks,
  signupHref,
  user,
  userRole,
  userType,
}: MobileSidebarProps) {
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSeller = userType === 'vendor' || isAdmin
  const shellRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) {
      return
    }
    const htmlShell = shell as HTMLElement
    ;(htmlShell as HTMLElement & { inert?: boolean }).inert = !open
  }, [open])

  const getFocusableElements = useCallback(() => {
    const panel = panelRef.current
    if (!panel) {
      return [] as HTMLElement[]
    }
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.offsetParent !== null
    )
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusInitial = () => {
      closeButtonRef.current?.focus()
    }
    const id = window.requestAnimationFrame(focusInitial)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') {
        return
      }
      const focusables = getFocusableElements()
      if (focusables.length === 0) {
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(id)
      document.removeEventListener('keydown', handleKeyDown)
      lastActiveElementRef.current?.focus()
    }
  }, [getFocusableElements, open])

  return (
    <div
      ref={shellRef}
      className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-[250ms] ease-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed bottom-0 left-0 top-0 z-[60] flex w-[min(18rem,100vw-2rem)] flex-col bg-white shadow-[4px_0_24px_rgba(15,23,42,0.08)] transition-transform duration-[250ms] ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <Link href="/" onClick={onClose} aria-label="Roorq home">
            <RoorqLogo className="h-7 w-auto text-black" />
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-black"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 px-4 py-5">
          {authLoading ? (
            <p className="text-sm text-neutral-500">Checking session...</p>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                  {getAvatarLabel(user)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-black">{user.email ?? 'Signed in'}</p>
                  <p className="text-xs text-neutral-500">
                    {isAdmin ? 'Admin account' : isSeller ? 'Seller account' : 'Member account'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-black"
                >
                  <UserIcon className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/messages"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Link>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                >
                  <Package className="h-4 w-4" />
                  Orders
                </Link>
                {isSeller ? (
                  <Link
                    href={isAdmin ? '/admin' : '/seller'}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                  >
                    <Store className="h-4 w-4" />
                    {isAdmin ? 'Admin' : 'Seller hub'}
                  </Link>
                ) : null}
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
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">Sign in to save drops, track orders, and open your profile.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={signupHref}
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
                <Link
                  href={loginHref}
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-3 text-sm font-semibold text-black"
                >
                  Log in
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Explore</p>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center rounded-2xl px-4 py-3 text-sm transition ${
                  isActivePath(currentPath, link.href)
                    ? 'bg-black text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Shop by category</p>
            {categoryLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="flex items-center rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 px-4 py-5">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">Support</p>
          <div className="space-y-2">
            <Link
              href="/saved"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <Heart className="h-4 w-4" />
              Saved
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>
            <Link
              href="/faq"
              onClick={onClose}
              className="flex items-center rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              onClick={onClose}
              className="flex items-center rounded-2xl px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
            >
              Contact
            </Link>
          </div>
        </div>
      </aside>
    </div>
  )
}
