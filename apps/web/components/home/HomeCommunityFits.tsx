import Image from 'next/image'
import Link from 'next/link'
import { Heart, ArrowUpRight } from 'lucide-react'

export type CommunityFit = {
  id: string
  username: string
  href: string
  image: string
  alt: string
  ratio: '1:1' | '4:5' | '3:4'
  likes: number
}

type HomeCommunityFitsProps = {
  fits: CommunityFit[]
  ctaHref?: string
}

const ratioToClass = (ratio: CommunityFit['ratio']) => {
  switch (ratio) {
    case '1:1':
      return 'aspect-[1/1]'
    case '4:5':
      return 'aspect-[4/5]'
    case '3:4':
    default:
      return 'aspect-[3/4]'
  }
}

export default function HomeCommunityFits({ fits, ctaHref = '/community' }: HomeCommunityFitsProps) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <header className="flex items-end justify-between gap-4 pb-5 sm:pb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-stone-500">
            Community
          </p>
          <h2 className="mt-2 text-[26px] font-black leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-[32px]">
            Community fits
          </h2>
        </div>

        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
        >
          Explore community
          <ArrowUpRight
            className="h-4 w-4 transition duration-[180ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.75}
          />
        </Link>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {fits.map((fit) => (
          <li key={fit.id}>
            <Link
              href={fit.href}
              className={`group relative block w-full overflow-hidden rounded-2xl bg-stone-200 ${ratioToClass(fit.ratio)}`}
            >
              <Image
                src={fit.image}
                alt={fit.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition duration-[400ms] ease-out group-hover:scale-[1.03]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition duration-[180ms] group-hover:opacity-100"
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-0 transition duration-[180ms] group-hover:opacity-100">
                <span className="truncate rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur">
                  @{fit.username}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur">
                  <Heart className="h-3.5 w-3.5" strokeWidth={2} />
                  {fit.likes}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
