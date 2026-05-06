import { ShieldCheck } from 'lucide-react'
import type { TrustBadge } from '@/lib/social/proof'

type TrustBadgesRowProps = {
  badges: TrustBadge[]
  compact?: boolean
}

export default function TrustBadgesRow({ badges, compact = false }: TrustBadgesRowProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-4'}`}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          title={badge.description}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      ))}
    </div>
  )
}
