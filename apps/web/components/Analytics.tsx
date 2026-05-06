'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { publicEnv } from '@/lib/env.public'
import { COOKIE_CONSENT_EVENT, hasConsent } from '@/lib/cookies'

const GA_ID = publicEnv.NEXT_PUBLIC_GA_ID

export default function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const update = () => setEnabled(hasConsent())
    update()
    window.addEventListener(COOKIE_CONSENT_EVENT, update)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, update)
  }, [])

  if (!GA_ID || !enabled) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  )
}
