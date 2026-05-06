import type { Metadata } from 'next'
import Link from 'next/link'
import { Star } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrustBadgesRow from '@/components/social/TrustBadgesRow'
import { buildMetadata } from '@/lib/seo/metadata'
import { buildBuyerSocialProfile } from '@/lib/social/proof'

type BuyerProfilePageProps = {
  params: { id: string }
}

export async function generateMetadata({ params }: BuyerProfilePageProps): Promise<Metadata> {
  return buildMetadata({
    title: `Buyer ${params.id} Profile`,
    description: 'Public buyer profile with verified trust indicators and review activity.',
    path: `/buyers/${params.id}`,
  })
}

export default async function BuyerProfilePage({ params }: BuyerProfilePageProps) {
  const buyer = buildBuyerSocialProfile(params.id)

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
          <div className="border-b border-stone-100 px-6 py-6 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Buyer profile</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">{buyer.displayName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">{buyer.bio}</p>
            <TrustBadgesRow badges={buyer.badges} />
          </div>

          <div className="grid gap-4 px-6 py-6 sm:px-8 md:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Followers</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{buyer.followerCount}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Following</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{buyer.followingCount}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Reviews written</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{buyer.reviewsWritten}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Helpful votes</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{buyer.helpfulVotesEarned}</p>
            </div>
          </div>

          <div className="px-6 pb-8 sm:px-8">
            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Style footprint</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {buyer.styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-stone-200 bg-white p-6 shadow-[0_16px_35px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Commerce signal</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Why buyer profiles matter</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Visible buyer history and helpful-vote scores make reviews more trustworthy, which lowers uncertainty and improves
            conversion on higher-intent product views.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue shopping
            <Star className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
