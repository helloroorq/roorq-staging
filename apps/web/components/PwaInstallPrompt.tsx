'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler as EventListener)

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-lg sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest">Install Seller App</p>
          <p className="text-[11px] text-gray-500">Faster orders, offline access, one tap home screen.</p>
        </div>
        <button
          onClick={handleInstall}
          className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Download className="h-4 w-4" />
          Install
        </button>
      </div>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
