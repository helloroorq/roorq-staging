import { ShieldCheck, Boxes, Store, Activity } from 'lucide-react'

type HomeFeatureStripProps = {
  listingCount: number
  sellerCount: number
  freshCount: number
}

const buildCards = (listingCount: number, sellerCount: number, freshCount: number) => [
  {
    title: 'Safe buying',
    value: 'COD + verified dispatch',
    detail: 'Campus-first checkout with low-friction support.',
    icon: ShieldCheck,
  },
  {
    title: 'Live listings',
    value: `${listingCount.toLocaleString()}+`,
    detail: 'Fresh product pages built for browsing, not catalog fatigue.',
    icon: Boxes,
  },
  {
    title: 'Active sellers',
    value: `${sellerCount.toLocaleString()}+`,
    detail: 'Public storefronts and seller profiles ready for discovery.',
    icon: Store,
  },
  {
    title: 'New this week',
    value: `${freshCount.toLocaleString()}+`,
    detail: 'New inventory lands fast, so the homepage always feels alive.',
    icon: Activity,
  },
]

export default function HomeFeatureStrip({
  listingCount,
  sellerCount,
  freshCount,
}: HomeFeatureStripProps) {
  const cards = buildCards(listingCount, sellerCount, freshCount)

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className="rounded-[28px] border border-stone-200/80 bg-white/85 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                    {card.title}
                  </p>
                  <p className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950">
                    {card.value}
                  </p>
                </div>
                <span className="rounded-2xl bg-stone-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{card.detail}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
