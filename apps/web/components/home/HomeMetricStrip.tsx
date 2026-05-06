import Link from 'next/link'
import { ShieldCheck, Sparkles, Users, GraduationCap } from 'lucide-react'

type HomeMetricStripProps = {
  listingCount: number
  freshCount: number
}

type MetricCard = {
  href: string
  icon: typeof ShieldCheck
  label: string
  value: string
  detail: string
}

const formatCount = (value: number) => value.toLocaleString('en-IN')

const buildCards = ({ listingCount, freshCount }: HomeMetricStripProps): MetricCard[] => [
  {
    href: '/shop',
    icon: ShieldCheck,
    label: 'COD +',
    value: 'Verified Dispatch',
    detail: 'Safe. Fast. Reliable.',
  },
  {
    href: '/shop?sort=newest',
    icon: Sparkles,
    label: `${formatCount(Math.max(listingCount, freshCount))}`,
    value: 'Live Listings',
    detail: 'Fresh pieces, every day.',
  },
  {
    href: '/sellers',
    icon: Users,
    label: '3',
    value: 'Active Sellers',
    detail: 'Trusted community.',
  },
  {
    href: '/about',
    icon: GraduationCap,
    label: 'Built on campus',
    value: 'IIT Roorkee',
    detail: 'Made by students, for students.',
  },
]

export default function HomeMetricStrip(props: HomeMetricStripProps) {
  const cards = buildCards(props)

  return (
    <section
      aria-label="Marketplace highlights"
      className="border-b border-stone-200/80 bg-white"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8 lg:py-6">
        <p className="shrink-0 text-[13.5px] font-medium tracking-[-0.005em] text-slate-700 lg:max-w-[200px]">
          Trusted by{' '}
          <span className="font-bold text-slate-950">100+</span> students at IIT Roorkee
        </p>

        <ul className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {cards.map(({ href, icon: Icon, label, value, detail }) => (
            <li key={value}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition duration-[180ms] ease-out hover:bg-stone-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-slate-900 transition duration-[180ms] group-hover:bg-slate-950 group-hover:text-white">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold tracking-[-0.01em] text-slate-950">
                    {label}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-semibold leading-tight text-slate-800">
                    {value}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{detail}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
