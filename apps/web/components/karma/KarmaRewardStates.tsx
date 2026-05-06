import { KARMA_RULES } from '@roorq/karma'
import type { KarmaSnapshot } from '@/lib/karma/types'
import { karmaReasonLabel } from '@/lib/karma/helpers'

export default function KarmaRewardStates({ snapshot }: { snapshot: KarmaSnapshot }) {
  const latestEntries = snapshot.recentTransactions.slice(0, 8)

  return (
    <section className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">V1 earn rules</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          PURCHASE_REVIEW_PHOTO: +{KARMA_RULES.PURCHASE_REVIEW_PHOTO}
        </p>
        <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          REFERRAL_FIRST_PURCHASE: +{KARMA_RULES.REFERRAL_FIRST_PURCHASE}
        </p>
        <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          RESALE_LISTED: +{KARMA_RULES.RESALE_LISTED}
        </p>
        <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          FIT_PHOTO_UPLOADED: +{KARMA_RULES.FIT_PHOTO_UPLOADED}
        </p>
        <p className="rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          DROP_SHARED_TO_INSTAGRAM: +{KARMA_RULES.DROP_SHARED_TO_INSTAGRAM}
        </p>
      </div>

      <p className="mt-5 text-sm text-slate-600">Spend at checkout: REDEMPTION_AT_CHECKOUT (deducts balance).</p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Recent activity</p>
        {latestEntries.length > 0 ? (
          <div className="mt-3 space-y-2">
            {latestEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{karmaReasonLabel(entry.reason)}</span>
                <span
                  className={
                    entry.delta < 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-600'
                  }
                >
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No karma activity yet.</p>
        )}
      </div>
    </section>
  )
}
