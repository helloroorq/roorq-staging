import { Sparkles } from 'lucide-react'
import type { KarmaSnapshot } from '@/lib/karma/types'

export default function KarmaBalanceCard({ snapshot }: { snapshot: KarmaSnapshot }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-stone-200 bg-slate-950 p-6 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">Karma balance</p>
          <p className="mt-3 text-4xl font-black tracking-[-0.06em]">{snapshot.balance}</p>
          <p className="mt-2 text-sm text-white/70">10 points = ₹1 off at checkout (max 20% per order)</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>
    </section>
  )
}
