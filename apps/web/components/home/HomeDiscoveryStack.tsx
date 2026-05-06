import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { PopularThisWeek, type PopularCard } from '@/components/home/PopularThisWeek'

type StyleCard = { title: string; image: string; href: string }
type BrandCard = { name: string; image: string; href: string }
const STYLE_CARDS: StyleCard[] = [
  { title: "Surf's up", image: '/community/fit-1.svg', href: '/shop?tag=surf' },
  { title: 'Polka dots', image: '/community/fit-2.svg', href: '/shop?tag=polka' },
  { title: 'Cool crochet', image: '/community/fit-4.svg', href: '/shop?tag=crochet' },
  { title: 'Spring knits', image: '/community/fit-6.svg', href: '/shop?tag=knits' },
  { title: 'Boho romance', image: '/community/fit-5.svg', href: '/shop?tag=boho' },
  { title: 'Cargo pants', image: '/community/fit-7.svg', href: '/shop?tag=cargo' },
]

const BRAND_CARDS: BrandCard[] = [
  { name: 'Steve Madden', image: '/drops/drop-001.svg', href: '/shop?search=Steve%20Madden' },
  { name: 'Patagonia', image: '/drops/drop-004.svg', href: '/shop?search=Patagonia' },
  { name: 'Converse', image: '/drops/drop-002.svg', href: '/shop?search=Converse' },
]

const POPULAR_CARDS: PopularCard[] = [
  { title: 'GAP hoodie', subtitle: '+1.5k searches', image: '/drops/drop-001.svg', href: '/shop?search=gap%20hoodie', price: 3199 },
  { title: 'Skylrk', subtitle: '+2.1k searches', image: '/drops/drop-003.svg', href: '/shop?search=skylrk', price: 2499 },
  { title: 'Athletic dress', subtitle: '+1.2k searches', image: '/drops/drop-002.svg', href: '/shop?search=athletic%20dress', price: 2899 },
  { title: 'Kate Spade bag', subtitle: '+1.4k searches', image: '/drops/drop-005.svg', href: '/shop?search=kate%20spade%20bag', price: 3499 },
]

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="text-[30px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[34px]">
      {children}
    </h3>
  )
}

export default function HomeDiscoveryStack() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <article className="grid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.06)] lg:grid-cols-[0.38fr_0.62fr]">
        <div className="bg-[#2f3640] px-6 py-6 text-white sm:px-8 sm:py-8">
          <p className="text-[24px] font-black tracking-[-0.03em]">Season 3 has landed</p>
          <p className="mt-2 max-w-sm text-[14px] leading-6 text-white/80">
            The stakes are higher and the fashion is bolder. Shop styles inspired by the groundbreaking show.
          </p>
          <Link
            href="/drops"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-white px-4 text-[13px] font-semibold text-slate-900 transition duration-[180ms] hover:bg-stone-100"
          >
            Let&apos;s go
          </Link>
        </div>
        <div className="relative min-h-[180px] bg-stone-200 sm:min-h-[220px]">
          <Image
            src="/seller-cta.svg"
            alt="Roorq editorial campaign banner"
            fill
            sizes="(max-width: 1024px) 100vw, 62vw"
            className="object-cover"
          />
          <button
            type="button"
            aria-label="Next banner"
            className="absolute right-4 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </article>

      <div className="mt-10">
        <SectionHeading>Shop by style</SectionHeading>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {STYLE_CARDS.map((card) => (
            <li key={card.title}>
              <Link href={card.href} className="group block">
                <div className="relative aspect-[5/3] overflow-hidden rounded-md bg-stone-100">
                  <Image src={card.image} alt={card.title} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" />
                </div>
                <p className="mt-2 text-center text-[16px] font-semibold text-slate-900">{card.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <SectionHeading>Popular brands</SectionHeading>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BRAND_CARDS.map((brand) => (
            <li key={brand.name} className="overflow-hidden rounded-md border border-stone-200 bg-white">
              <div className="relative aspect-[16/5]">
                <Image src={brand.image} alt={brand.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </div>
              <div className="flex items-center justify-between border-t border-stone-200 px-3 py-2">
                <span className="text-[13px] font-semibold text-slate-900">{brand.name}</span>
                <Link href={brand.href} className="inline-flex items-center rounded-sm bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                  Shop
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <PopularThisWeek cards={POPULAR_CARDS} />
    </section>
  )
}
