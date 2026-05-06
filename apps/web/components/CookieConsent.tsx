'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { COOKIE_CONSENT_EVENT, getCookieConsent, setCookieConsent } from '@/lib/cookies'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const current = getCookieConsent()
    setVisible(current === null)
  }, [])

  const applyConsent = (accepted: boolean) => {
    setCookieConsent(accepted)
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-5">
      <div className="mx-auto max-w-5xl rounded-2xl border border-black/10 bg-white/95 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-black">We use cookies</p>
            <p className="text-xs text-gray-600">
              Essential cookies keep your cart and login secure. Analytics cookies help us improve the site and are only used if you accept.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => applyConsent(false)}
              className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-black hover:text-white"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => applyConsent(true)}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-gray-900"
            >
              Accept all
            </button>
            <Link
              href="/cookies"
              className="text-xs font-semibold uppercase tracking-wide text-gray-600 hover:text-black"
            >
              Cookie settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
