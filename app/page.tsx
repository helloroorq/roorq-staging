import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeFeatureStrip from '@/components/home/HomeFeatureStrip'
import HomePromoCarousel from '@/components/home/HomePromoCarousel'
import HomeStyleGrid from '@/components/home/HomeStyleGrid'
import HomeTrendingRail from '@/components/home/HomeTrendingRail'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceReadClient } from '@/lib/marketplace/public'
import { buildMetadata } from '@/lib/seo/metadata'
import type { MarketplaceProduct, StyleTile } from '@/components/home/types'

export const metadata = buildMetadata({
  title: 'Marketplace',
  description:
    'Image-first vintage marketplace for IIT Roorkee. Browse trending drops, discover sellers, and shop campus-safe.',
  path: '/',
  keywords: ['Roorq marketplace', 'vintage marketplace', 'IIT Roorkee fashion', 'buy and sell vintage'],
})

const FALLBACK_STYLE_IMAGES: Record<string, string> = {
  jacket: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
  't-shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  skirt: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  sportswear: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  accessories: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
}

const PROMO_SLIDES = [
  {
    title: 'Fresh vintage that actually feels browsable.',
    subtitle: 'Daily drop',
    description:
      'Swipe through clean product pages, low-noise search, and category-led discovery built to keep conversion high.',
    href: '/shop?sort=newest',
    cta: 'See new arrivals',
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Soft tailoring, denim, and statement pieces in one feed.',
    subtitle: 'Curated style',
    description:
      'Shop by mood instead of endless filters. The homepage now behaves like a marketplace, not a static brochure.',
    href: '/shop?gender=women',
    cta: 'Browse women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Sell faster with sharper listings and cleaner discovery.',
    subtitle: 'Seller growth',
    description:
      'Public storefronts, scroll-first product cards, and a stronger home feed make it easier to convert interest into orders.',
    href: '/sell',
    cta: 'Start selling',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80',
  },
]

const isProductImage = (product: MarketplaceProduct) => Boolean(product.images?.[0])

const getStyleTiles = (products: MarketplaceProduct[]): StyleTile[] => {
  const findImage = (matcher: (product: MarketplaceProduct) => boolean, fallback: string) =>
    products.find((product) => matcher(product) && isProductImage(product))?.images?.[0] ?? fallback

  return [
    {
      title: 'Vintage outerwear',
      eyebrow: 'Layer up',
      href: '/shop?category=jacket',
      image: findImage((product) => product.category === 'jacket', FALLBACK_STYLE_IMAGES.jacket),
    },
    {
      title: 'Denim rotation',
      eyebrow: 'Everyday uniforms',
      href: '/shop?category=jeans',
      image: findImage((product) => product.category === 'jeans', FALLBACK_STYLE_IMAGES.jeans),
    },
    {
      title: 'Graphic tees',
      eyebrow: 'Image-first picks',
      href: '/shop?category=t-shirt',
      image: findImage((product) => product.category === 't-shirt', FALLBACK_STYLE_IMAGES['t-shirt']),
    },
    {
      title: "Women's edit",
      eyebrow: 'Curated daily',
      href: '/shop?gender=women',
      image: findImage((product) => product.gender === 'women', FALLBACK_STYLE_IMAGES.skirt),
    },
    {
      title: 'Sportcore',
      eyebrow: 'Campus movement',
      href: '/shop?category=sportswear',
      image: findImage((product) => product.category === 'sportswear', FALLBACK_STYLE_IMAGES.sportswear),
    },
    {
      title: 'Accessories',
      eyebrow: 'Small upgrades',
      href: '/shop?category=accessories',
      image: findImage((product) => product.category === 'accessories', FALLBACK_STYLE_IMAGES.accessories),
    },
  ]
}

const getTrendingProducts = (products: MarketplaceProduct[]) =>
  [...products]
    .sort((left, right) => {
      const leftScore = (left.views_count ?? 0) + (left.sales_count ?? 0) * 40
      const rightScore = (right.views_count ?? 0) + (right.sales_count ?? 0) * 40
      return rightScore - leftScore
    })
    .slice(0, 10)

export default async function Home() {
  const supabase = await createClient()
  const marketplaceReadClient = await getMarketplaceReadClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: products },
    { count: listingCount },
    { count: sellerCount },
    { count: freshCount },
  ] = await Promise.all([
    supabase
      .from('products')
      .select(
        'id, name, price, size, images, category, gender, brand, views_count, sales_count, stock_quantity, reserved_quantity'
      )
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('approval_status', 'approved'),
    marketplaceReadClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'vendor')
      .eq('vendor_status', 'approved'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .gte('created_at', sevenDaysAgo),
  ])

  const liveProducts = (products ?? []) as MarketplaceProduct[]
  const heroProducts = liveProducts.filter(isProductImage).slice(0, 3)
  const styleTiles = getStyleTiles(liveProducts)
  const trendingProducts = getTrendingProducts(liveProducts)

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950 selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main className="pb-16">
        <HomeHero heroProducts={heroProducts} />
        <HomeFeatureStrip
          listingCount={listingCount ?? liveProducts.length}
          sellerCount={sellerCount ?? 0}
          freshCount={freshCount ?? liveProducts.length}
        />
        <HomePromoCarousel slides={PROMO_SLIDES} />
        <HomeStyleGrid tiles={styleTiles} />
        <HomeTrendingRail products={trendingProducts} />

        <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-stone-200 bg-white px-6 py-8 shadow-[0_24px_50px_rgba(15,23,42,0.06)] sm:px-8 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-stone-500">
                Ready to list?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
                Sell with a cleaner storefront and faster discovery.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Build your seller profile, upload products, and get discovered through the same image-first
                marketplace experience buyers see on the homepage.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Link
                href="/sell"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start selling
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-stone-50"
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
