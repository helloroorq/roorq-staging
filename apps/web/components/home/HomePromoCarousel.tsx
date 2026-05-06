'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

type Slide = {
  title: string
  subtitle: string
  description: string
  href: string
  cta: string
  image: string
}

type HomePromoCarouselProps = {
  slides: Slide[]
}

export default function HomePromoCarousel({ slides }: HomePromoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [slides.length])

  return (
    <section className="w-full py-8">
      <div className="overflow-hidden rounded-[28px] bg-slate-900 text-white shadow-[0_30px_60px_rgba(15,23,42,0.16)] mx-4 sm:mx-6 lg:mx-0 lg:rounded-none">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <article
              key={slide.title}
              className="grid min-w-full gap-0 lg:grid-cols-[0.38fr_0.62fr]"
            >
              <div className="flex flex-col justify-between gap-8 p-8 md:p-12 lg:p-16">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">
                    {slide.subtitle}
                  </p>
                  <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                    {slide.title}
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/72 sm:text-base">
                    {slide.description}
                  </p>
                </div>
                <Link
                  href={slide.href}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                >
                  {slide.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative min-h-[280px] bg-slate-800 sm:min-h-[400px] lg:min-h-[460px]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1))
              }
              className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
              className="rounded-full border border-white/20 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
