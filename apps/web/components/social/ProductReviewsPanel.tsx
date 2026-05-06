'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Flag, MessageCircle, ThumbsUp } from 'lucide-react'
import type { ProductReview } from '@/lib/social/proof'

type ProductReviewsPanelProps = {
  reviews: ProductReview[]
}

export default function ProductReviewsPanel({ reviews }: ProductReviewsPanelProps) {
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({})
  const [reportedReviewIds, setReportedReviewIds] = useState<string[]>([])

  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Buyer reviews</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Fit, quality, and trust feedback</h3>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {reviews.map((review) => {
          const voteLift = helpfulVotes[review.id] ?? 0
          const alreadyReported = reportedReviewIds.includes(review.id)

          return (
            <article key={review.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                <Link href={`/buyers/${review.buyerId}`} className="text-slate-900 underline-offset-2 hover:underline">
                  {review.buyerName}
                </Link>
                <span>{review.buyerHostel}</span>
                <span>{review.createdAtLabel}</span>
                {review.verifiedPurchase ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Verified purchase</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHelpfulVotes((current) => ({ ...current, [review.id]: (current[review.id] ?? 0) + 1 }))
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:border-stone-400"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful ({review.helpfulCount + voteLift})
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:border-stone-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ask buyer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!alreadyReported) {
                      setReportedReviewIds((current) => [...current, review.id])
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold transition ${
                    alreadyReported
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-stone-300 bg-white text-slate-700 hover:border-stone-400'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {alreadyReported ? 'Reported' : 'Report'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Moderation and credibility</p>
        <ul className="mt-2 space-y-1 text-xs leading-6 text-stone-600">
          <li>Only verified purchases can publish product reviews.</li>
          <li>Spam or abusive language is filtered and can be reported by buyers.</li>
          <li>Seller replies are visible but cannot edit buyer ratings.</li>
        </ul>
      </div>
    </section>
  )
}
