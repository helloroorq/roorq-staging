import { ShieldCheck, BadgeCheck, GraduationCap, Lock } from 'lucide-react'

const SIGNALS = [
  { icon: ShieldCheck, label: 'Buyer Protection' },
  { icon: BadgeCheck, label: 'Verified Sellers' },
  { icon: GraduationCap, label: 'Campus Trusted' },
  { icon: Lock, label: 'Secure Checkout' },
] as const

export default function HomeTrustBar() {
  return (
    <section
      aria-label="Marketplace trust signals"
      className="border-b border-stone-200/80 bg-white"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        {SIGNALS.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 text-[12.5px] font-medium tracking-[-0.005em] text-slate-600"
          >
            <Icon className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
