import Link from 'next/link'
import HomeCommunityFits from '@/components/home/HomeCommunityFits'
import { buildMetadata } from '@/lib/seo/metadata'
import { createClient } from '@/lib/supabase/server'
import { fetchHomeCommunityFits } from '@/lib/marketplace/community-fits'

export const revalidate = 60

export const metadata = buildMetadata({
  title: 'Community Fits',
  description: 'Explore how the Roorq community styles vintage pieces on campus.',
  path: '/community',
})

export default async function CommunityPage() {
  const supabase = await createClient()
  const fits = await fetchHomeCommunityFits(supabase)

  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-4 pt-10 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-stone-500">
          Roorq community
        </p>
        <h1 className="mt-3 text-[34px] font-black tracking-[-0.04em] text-slate-950 sm:text-[42px]">
          Campus fits, styled by real students
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
          Discover daily styling from the IIT Roorkee vintage community and shop pieces linked
          directly to similar marketplace edits.
        </p>
        <div className="mt-6">
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-slate-700 transition duration-[180ms] hover:border-slate-400 hover:bg-stone-50"
          >
            Shop similar pieces
          </Link>
        </div>
      </section>

      {fits.length > 0 ? (
        <HomeCommunityFits fits={fits} ctaHref="/shop" />
      ) : (
        <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              Building the wall
            </p>
            <p className="mt-3 text-base font-semibold text-slate-900">
              The first community fits will land here as soon as buyers post review photos.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Want to be one of the first? Order from a campus seller, share a photo with your
              review, and your fit appears here for everyone to discover.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
