import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const SELLER_IMAGE = '/seller-cta.svg'

export default function HomeSellerSplit() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl bg-[#0b0b0c] text-white shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:grid-cols-2 lg:rounded-[28px]">
        <div className="flex flex-col justify-between gap-10 px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-rose-400/90">
              Seller community
            </p>

            <h2 className="mt-5 text-[40px] font-black leading-[0.95] tracking-[-0.045em] sm:text-[48px] lg:text-[52px]">
              Got pieces with a story?
              <br />
              <span className="text-white/95">Sell where taste shops.</span>
            </h2>

            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.7] text-white/70">
              Join thousands of sellers who turn their style into stories (and income). Build a
              storefront, run drops, and reach buyers who actually care.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sell"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition duration-[180ms] ease-out hover:bg-rose-50"
            >
              Start selling
              <ArrowRight
                className="h-4 w-4 transition duration-[180ms] group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>

            <Link
              href="/sell/learn"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white/85 transition duration-[180ms] ease-out hover:border-white/40 hover:text-white"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden lg:min-h-[420px]">
          <Image
            src={SELLER_IMAGE}
            alt="Seller styling vintage finds for a Roorq drop"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#0b0b0c]/40 via-transparent to-transparent lg:from-[#0b0b0c]/30"
          />
        </div>
      </div>
    </section>
  )
}
