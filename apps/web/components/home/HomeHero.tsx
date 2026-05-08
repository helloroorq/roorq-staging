'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function HomeHero() {
  return (
    <section style={{ background: 'rgb(var(--rq-bg))' }}>
      <div className="mx-auto max-w-[1820px] px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl bg-white">
          {/* DROP 001 pill — absolute top-left of card */}
          <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 md:left-5 md:top-5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-white">DROP 001 · MAY 13</span>
          </div>

          {/* Two-column grid: headline left, image right */}
          <div className="grid grid-cols-[1.1fr_1fr] md:grid-cols-2">
            {/* LEFT — headline + eyebrow */}
            <div className="flex flex-col justify-center px-5 pb-0 pt-14 sm:px-7 sm:pt-16 md:px-10 md:py-16 lg:px-14 lg:py-20">
              <h1
                className="text-[2.8rem] leading-[0.88] tracking-[-0.04em] text-[rgb(var(--rq-ink))] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.5rem] xl:text-[7.5rem]"
                style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
              >
                <span className="block">WEAR WHAT</span>
                <span className="block">THEY</span>
                <span className="block">CAN&apos;T.</span>
              </h1>
              <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--rq-ink-muted))] sm:text-[11px] md:mt-4">
                CURATED VINTAGE. WORN DIFFERENT.
              </p>
            </div>

            {/* RIGHT — product image */}
            <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px] md:min-h-[420px] lg:min-h-[520px]">
              <Image
                src="/hero-couple.png"
                alt="ROORQ — couple on a chesterfield sofa wearing curated vintage streetwear"
                fill
                priority
                quality={85}
                sizes="(max-width: 768px) 50vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* CTA — full-width across the bottom of the card */}
          <Link
            href="/drop-001"
            className="group flex h-12 w-full items-center justify-center gap-2 bg-[rgb(var(--rq-brand))] px-6 text-sm font-bold uppercase tracking-tight text-white transition duration-150 hover:opacity-90 md:h-14 md:text-base"
          >
            LOCK MY DROP 001 SLOT
            <ArrowRight className="h-5 w-5 transition duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
