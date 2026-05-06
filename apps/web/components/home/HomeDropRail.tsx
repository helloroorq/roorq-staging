'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ArrowUpRight, ChevronRight, BadgeCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type DropCard = {
  id: string
  name: string
  href: string
  image: string
  status: 'live' | 'ending'
  endsAtMs: number
  priceMin: number
  priceMax: number
  likes: number
}

type HomeDropRailProps = {
  drops: DropCard[]
  title?: string
  ctaHref?: string
}

const PRICE_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const formatPriceRange = (min: number, max: number) => `${PRICE_FORMAT.format(min)} - ${PRICE_FORMAT.format(max)}`

const padTwo = (value: number) => value.toString().padStart(2, '0')

const formatCountdown = (deltaMs: number, status: DropCard['status']) => {
  if (deltaMs <= 0) {
    return status === 'live' ? 'Live' : 'Ended'
  }

  const totalSeconds = Math.floor(deltaMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (status === 'live') {
    return `${padTwo(hours)}h : ${padTwo(minutes)}m : ${padTwo(seconds)}s`
  }

  if (hours >= 24) {
    return `Ends in ${Math.floor(hours / 24)}d`
  }
  if (hours > 0) {
    return `Ends in ${padTwo(hours)}h`
  }
  return `Ends in ${padTwo(minutes)}m`
}

/**
 * Clock for countdowns — must not use Date.now() during SSR/first paint or the
 * server HTML and client hydrate string will differ (hydration error).
 */
const useNow = () => {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return now
}

export default function HomeDropRail({ drops, title = 'Latest drops', ctaHref = '/drops' }: HomeDropRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const now = useNow()

  const scrollByCards = (direction: 1 | -1) => {
    const node = railRef.current
    if (!node) return
    node.scrollBy({ left: direction * Math.max(node.clientWidth * 0.85, 320), behavior: 'smooth' })
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <header className="flex items-end justify-between gap-4 pb-5 sm:pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-stone-500">
            Drops
          </p>
          <h2 className="mt-2 text-[26px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[32px]">
            {title}
          </h2>
        </div>

        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
        >
          View all drops
          <ArrowUpRight
            className="h-4 w-4 transition duration-[180ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.75}
          />
        </Link>
      </header>

      <div className="relative">
        <div
          ref={railRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {drops.map((drop) => {
            const countdown =
              now === null
                ? drop.status === 'live'
                  ? 'Live'
                  : 'Ending soon'
                : formatCountdown(drop.endsAtMs - now, drop.status)
            const isLive =
              drop.status === 'live' &&
              (now === null ? drop.endsAtMs > 0 : drop.endsAtMs - now > 0)

            return (
              <Link
                key={drop.id}
                href={drop.href}
                className="group relative flex aspect-[16/10] min-w-[280px] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-stone-200 sm:min-w-[300px] sm:max-w-[300px]"
              >
                <Image
                  src={drop.image}
                  alt={drop.name}
                  fill
                  sizes="(max-width: 640px) 280px, 300px"
                  className="object-cover transition duration-[400ms] ease-out group-hover:scale-[1.03]"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                />

                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  {isLive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_8px_rgba(225,29,72,0.5)]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      Live now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                      <BadgeCheck className="h-3 w-3" strokeWidth={2.25} />
                      Verified
                    </span>
                  )}
                </div>

                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10.5px] font-semibold tracking-[0.06em] text-white backdrop-blur">
                  {countdown}
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-white">
                      {drop.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-white/75">
                      {formatPriceRange(drop.priceMin, drop.priceMax)}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <Heart className="h-3.5 w-3.5" strokeWidth={2} />
                    {drop.likes}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Scroll drops forward"
          onClick={() => scrollByCards(1)}
          className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition duration-[180ms] hover:border-stone-300 hover:bg-stone-50 sm:inline-flex"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}
