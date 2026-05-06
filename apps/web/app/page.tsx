import Link from 'next/link'
import Footer from '@/components/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeMetricStrip from '@/components/home/HomeMetricStrip'
import HomeBrandStrip from '@/components/home/HomeBrandStrip'
import HomeUrgencyTicker from '@/components/home/HomeUrgencyTicker'
import HomeSellerSplit from '@/components/home/HomeSellerSplit'
import HomeDiscoveryStack from '@/components/home/HomeDiscoveryStack'
import HomeDropRail from '@/components/home/HomeDropRail'
import HomeCommunityFits from '@/components/home/HomeCommunityFits'
import HomeTeamSection from '@/components/home/HomeTeamSection'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { fetchHomeDrops } from '@/lib/marketplace/drops'
import { fetchHomeCommunityFits } from '@/lib/marketplace/community-fits'

// Marketplace data feels live but is edge-cached for 60s; protects Supabase from N concurrent reads.
export const revalidate = 60

type HomeMetrics = {
  listingCount: number
  freshCount: number
}

/**
 * Counting active listings is non-critical for rendering. If Supabase blips we serve the page
 * with conservative zeros so a dashboard outage cannot 500 the homepage.
 */
async function loadMetrics(supabase: Awaited<ReturnType<typeof createClient>>): Promise<HomeMetrics> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const [listing, fresh] = await Promise.all([
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('approval_status', 'approved'),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .gte('created_at', sevenDaysAgo),
    ])

    return {
      listingCount: listing.count ?? 0,
      freshCount: fresh.count ?? 0,
    }
  } catch (cause) {
    logger.warn(
      'home: loadMetrics failed; rendering with zeros',
      cause instanceof Error ? { message: cause.message } : undefined
    )
    return { listingCount: 0, freshCount: 0 }
  }
}

export default async function Home() {
  const supabase = await createClient()

  const [metrics, drops, fits] = await Promise.all([
    loadMetrics(supabase),
    fetchHomeDrops(supabase),
    fetchHomeCommunityFits(supabase),
  ])

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950 selection:bg-slate-900 selection:text-white">
      <main>
        <HomeHero />

        <HomeMetricStrip listingCount={metrics.listingCount} freshCount={metrics.freshCount} />

        <HomeBrandStrip />

        <HomeUrgencyTicker />

        <HomeSellerSplit />
        <HomeDiscoveryStack />

        {drops.length > 0 ? <HomeDropRail drops={drops} title="Latest drops" /> : null}

        {fits.length > 0 ? <HomeCommunityFits fits={fits} ctaHref="/community" /> : null}

        <HomeTeamSection />

        <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-3xl border border-stone-200 bg-white px-6 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-stone-500">
                Ready to list?
              </p>
              <h2 className="mt-3 text-[28px] font-black leading-[1.1] tracking-[-0.04em] text-slate-950 sm:text-[34px]">
                Sell with a cleaner storefront and faster discovery.
              </h2>
              <p className="mt-3 max-w-[520px] text-[14.5px] leading-[1.7] text-slate-600">
                Build a seller profile, upload pieces, and get discovered through the same image-first
                marketplace experience buyers see on the homepage.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sell"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition duration-[180ms] hover:bg-slate-800"
              >
                Start selling
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 px-6 text-sm font-semibold text-slate-700 transition duration-[180ms] hover:border-slate-400 hover:bg-stone-50"
              >
                Explore listings
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
