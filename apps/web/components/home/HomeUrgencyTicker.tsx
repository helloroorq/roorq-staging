import { Clock, Users } from 'lucide-react'

export default function HomeUrgencyTicker() {
  return (
    <section
      aria-label="Marketplace activity"
      className="border-b border-stone-200/80 bg-[#0b0b0c] text-white/85"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-[12.5px] font-medium tracking-[-0.005em] sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-rose-400" strokeWidth={2} />
          New drops every <span className="font-semibold text-white">Friday 8 PM IST</span>
        </span>

        <span aria-hidden="true" className="hidden h-3 w-px bg-white/20 sm:inline-block" />

        <span className="inline-flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-rose-400" strokeWidth={2} />
          <span className="font-semibold text-white">10k+ students</span> browsing this week
        </span>
      </div>
    </section>
  )
}
