'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatINR } from '@/lib/utils/currency'

export type PopularCard = {
  title: string
  subtitle: string
  image: string
  href: string
  price: number
}

export function PopularThisWeek({ cards }: { cards: PopularCard[] }) {
  const scrollRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const syncArrows = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    setCanPrev(scrollLeft > 6)
    setCanNext(scrollLeft < maxScroll - 6)
  }

  useEffect(() => {
    syncArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', syncArrows, { passive: true })
    window.addEventListener('resize', syncArrows)
    return () => {
      el.removeEventListener('scroll', syncArrows)
      window.removeEventListener('resize', syncArrows)
    }
  }, [cards])

  const scrollByDir = (dir: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return
    const step = Math.max(Math.floor(el.clientWidth * 0.72), 160)
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' })
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[34px]">
          Popular this week
        </h3>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Previous popular items"
            disabled={!canPrev}
            onClick={() => scrollByDir('prev')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-900 transition-opacity disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next popular items"
            disabled={!canNext}
            onClick={() => scrollByDir('next')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-900 transition-opacity disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={scrollRef}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <li
            key={card.title}
            className="w-[min(100%,calc(50%-0.5rem))] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:snap-none"
          >
            <Link href={card.href} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-stone-100">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 45vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-2 text-[14px] font-bold text-slate-900">{card.title}</p>
              <p className="text-[12px] font-medium text-slate-500">{card.subtitle}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                {formatINR(card.price)}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
