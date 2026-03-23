'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { MarketplaceProduct } from '@/components/home/types'

type HomeHeroProps = {
  heroProducts: MarketplaceProduct[]
}

const copy = {
  buy: {
    headline: 'Find your next favorite piece before everyone else.',
    body:
      'Browse fresh vintage drops, campus-safe checkout, and image-first listings built to keep you scrolling.',
    primaryLabel: 'Shop now',
    primaryHref: '/shop',
    secondaryLabel: 'Start selling',
    secondaryHref: '/sell',
  },
  sell: {
    headline: 'Turn your wardrobe into a marketplace-ready store.',
    body:
      'List faster, build your seller profile, and move inventory with a cleaner flow than generic resale apps.',
    primaryLabel: 'Start selling',
    primaryHref: '/sell',
    secondaryLabel: 'See live listings',
    secondaryHref: '/shop',
  },
} as const

const fallbackImages = [
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
]

export default function HomeHero({ heroProducts }: HomeHeroProps) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')

  const collage = useMemo(
    () =>
      fallbackImages.map((fallback, index) => ({
        image: heroProducts[index]?.images?.[0] ?? fallback,
        title: heroProducts[index]?.name ?? 'Roorq drop',
      })),
    [heroProducts]
  )

  const activeCopy = copy[mode]

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(241,236,227,0.92)_42%,_rgba(232,229,244,0.9)_100%)]">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),transparent)]" />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
        <div className="relative z-10">
          <div className="inline-flex rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
            {(['buy', 'sell'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                  mode === item
                    ? 'bg-slate-900 text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-500">
              <Sparkles className="h-3.5 w-3.5" />
              Roorq marketplace
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
              {activeCopy.headline}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              {activeCopy.body}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={activeCopy.primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {activeCopy.primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={activeCopy.secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              {activeCopy.secondaryLabel}
            </Link>
          </div>
        </div>

        <div className="relative h-[320px] sm:h-[420px]">
          <div className="absolute inset-0 rounded-[34px] bg-white/40 blur-3xl" />
          {collage.map((item, index) => {
            const cardClasses = [
              'left-0 top-8 rotate-[-8deg]',
              'left-[26%] top-0 rotate-[6deg]',
              'right-0 top-10 rotate-[12deg]',
            ]

            return (
              <article
                key={`${item.title}-${index}`}
                className={`absolute h-[250px] w-[44%] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_50px_rgba(15,23,42,0.14)] sm:h-[320px] ${cardClasses[index]}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 40vw, 22vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.82))] px-4 pb-4 pt-10 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Trending now
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.title}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
