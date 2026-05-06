'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type HomeHeroProps = {
  heroProducts?: unknown
}

const HEADLINE_LINES = ['WEAR WHAT', 'THEY', "CAN'T."] as const

const SUBCOPY_LINES = [
  'Campus-born vintage marketplace.',
  'Curated drops. Verified sellers. One-off finds.',
] as const

const SLIDE_DOT_COUNT = 3

export default function HomeHero(_props: HomeHeroProps) {
  const [heroImageSrc, setHeroImageSrc] = useState('/hero-section3.png')

  return (
    <section className="relative overflow-hidden border-b border-black/5 bg-[#ece0d0]">
      <div className="mx-auto max-w-[1820px] px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[#f3e7d8] shadow-[0_24px_80px_rgba(42,27,16,0.14)] md:rounded-[32px]">
          <Image
            src={heroImageSrc}
            alt="ROORQ vintage campaign with two models on a sofa"
            width={1680}
            height={945}
            priority
            quality={100}
            sizes="100vw"
            className="block h-auto w-full"
            onError={() => {
              // Fallback so hero never appears broken if the primary asset fails.
              setHeroImageSrc('/roorq-hero.png')
            }}
          />

          <div className="pointer-events-none absolute inset-0 z-10 hidden sm:block">
            <div className="absolute left-8 top-8 inline-flex items-center gap-2 rounded-full border-[1.5px] border-black/80 bg-transparent px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a1a1a] md:px-6 md:py-3 md:text-[12px]">
              <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
              IIT ROORKEE&apos;S FIRST VINTAGE LABEL
            </div>

            <div className="absolute left-[64.8%] top-[11.5%] w-[32.2%] rounded-2xl bg-[#f3e7d8]/88 p-4 shadow-[0_8px_26px_rgba(26,26,26,0.12)] backdrop-blur-[2px] md:p-5">
              <div
                className="text-left text-[clamp(2.3rem,8.1vw,8.7rem)] uppercase leading-[0.9] tracking-[-0.05em] text-[#121212] [text-shadow:0_1px_0_rgba(255,255,255,0.22)]"
                style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
              >
                {HEADLINE_LINES.map((line) => (
                  <span key={line} data-text={line} className="roorq-hero-distressed block">
                    {line}
                  </span>
                ))}
              </div>

              <div
                className="mt-4 text-left text-[clamp(0.8rem,1.04vw,1.06rem)] leading-[1.65] text-[#232323] md:mt-[18px]"
                style={{ fontFamily: 'var(--font-libre-baskerville), Georgia, serif' }}
              >
                {SUBCOPY_LINES.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <Link
                href="/shop"
                className="pointer-events-auto group mt-7 flex h-[clamp(3rem,4vw,4rem)] w-full items-center justify-center bg-[#8B1A1A] px-4 text-center text-[clamp(0.66rem,1.02vw,1.05rem)] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(139,26,26,0.28)] transition duration-[180ms] ease-out hover:-translate-y-0.5 hover:bg-[#7a1414] hover:shadow-[0_14px_30px_rgba(139,26,26,0.35)] md:mt-[28px]"
                style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
              >
                <span>SHOP DROP 001</span>
                <span
                  aria-hidden="true"
                  className="ml-3 inline-block transition duration-[180ms] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </div>

            <div
              aria-hidden="true"
              className="absolute bottom-6 left-8 flex items-center gap-2 md:bottom-8 md:left-10"
            >
              {Array.from({ length: SLIDE_DOT_COUNT }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index === 0
                      ? 'h-1.5 w-7 rounded-full bg-[#1a1a1a]'
                      : 'h-1.5 w-1.5 rounded-full bg-[#1a1a1a]/35'
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-black/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a1a1a]">
            <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-600" />
            IIT ROORKEE&apos;S FIRST VINTAGE LABEL
          </div>

          <div
            className="mt-5 text-[clamp(2.25rem,14vw,3.7rem)] uppercase leading-[0.92] tracking-[-0.05em] text-[#1A1A1A]"
            style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
          >
            {HEADLINE_LINES.map((line) => (
              <span key={line} data-text={line} className="roorq-hero-distressed block">
                {line}
              </span>
            ))}
          </div>

          <div
            className="mt-4 text-[0.95rem] leading-[1.7] text-[#2A2A2A]"
            style={{ fontFamily: 'var(--font-libre-baskerville), Georgia, serif' }}
          >
            {SUBCOPY_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <Link
            href="/shop"
            className="group mt-6 flex h-14 w-full items-center justify-center bg-[#8B1A1A] px-4 text-center text-[0.8rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(139,26,26,0.28)] transition duration-[180ms]"
            style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
          >
            <span>SHOP DROP 001</span>
            <span aria-hidden="true" className="ml-3 inline-block transition duration-[180ms] group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
