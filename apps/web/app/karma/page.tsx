'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import KarmaBalanceCard from '@/components/karma/KarmaBalanceCard'
import KarmaRewardStates from '@/components/karma/KarmaRewardStates'
import { useAuth } from '@/components/providers/AuthProvider'
import { useKarma } from '@/hooks/useKarma'

export default function KarmaPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { loading, error, snapshot } = useKarma()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth?redirect=/karma')
    }
  }, [authLoading, router, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f4ee]">
        <p className="text-sm text-slate-500">Loading karma…</p>
      </div>
    )
  }

  if (error && !snapshot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f7f4ee] px-4 text-center">
        <p className="text-sm text-rose-700">{error}</p>
        <p className="text-xs text-slate-500">Set NEXT_PUBLIC_KARMA_API_URL to the Fastify karma service.</p>
      </div>
    )
  }

  if (!snapshot) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950">Karma</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Earn points for selected actions; redeem up to 20% off per order at checkout (10 points = ₹1).
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <KarmaBalanceCard snapshot={snapshot} />
        </div>
        <div className="mt-6">
          <KarmaRewardStates snapshot={snapshot} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
