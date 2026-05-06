import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { StyleTile } from '@/components/home/types'

type HomeStyleGridProps = {
  tiles: StyleTile[]
}

export default function HomeStyleGrid({ tiles }: HomeStyleGridProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-500">
            Browse by mood
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
            Shop by style
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 md:inline-flex"
        >
          View all styles
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            className="group overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.1)]"
          >
            <div className="relative aspect-[5/4] overflow-hidden bg-[#f4efe8]">
              <Image
                src={tile.image}
                alt={tile.title}
                fill
                sizes="(max-width: 1280px) 50vw, 30vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  {tile.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">
                  {tile.title}
                </h3>
              </div>
              <span className="rounded-full bg-stone-100 p-3 text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
