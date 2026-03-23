import Image from 'next/image'
import Link from 'next/link'
import { Eye, Flame, ArrowUpRight } from 'lucide-react'
import { formatINR } from '@/lib/utils/currency'
import type { MarketplaceProduct } from '@/components/home/types'

type HomeTrendingRailProps = {
  products: MarketplaceProduct[]
}

const metricValue = (value: number | null | undefined) => {
  if (!value || value <= 0) return 'New'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toString()
}

export default function HomeTrendingRail({ products }: HomeTrendingRailProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-500">
            Marketplace momentum
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
            Trending right now
          </h2>
        </div>
        <Link
          href="/shop?sort=bestsellers"
          className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 md:inline-flex"
        >
          Browse all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group min-w-[240px] max-w-[240px] flex-shrink-0 rounded-[28px] border border-stone-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.1)] sm:min-w-[270px] sm:max-w-[270px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-stone-100">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="270px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.26em] text-stone-400">
                  Roorq
                </div>
              )}
            </div>

            <div className="px-1 pb-1 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="line-clamp-1 text-base font-black tracking-[-0.03em] text-slate-950">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    {product.brand || product.category || 'Fresh drop'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatINR(product.price)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {metricValue(product.views_count)} views
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">
                  <Flame className="h-3.5 w-3.5" />
                  {metricValue(product.sales_count)} sold
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
