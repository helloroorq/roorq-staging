import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StartConversationButton from '@/components/messages/StartConversationButton'
import ProductCard from '@/components/ProductCard'
import StructuredData from '@/components/StructuredData'
import FollowSellerButton from '@/components/social/FollowSellerButton'
import TrustBadgesRow from '@/components/social/TrustBadgesRow'
import { createClient } from '@/lib/supabase/server'
import { fetchApprovedStoreById } from '@/lib/marketplace/public'
import { buildSellerSocialProof } from '@/lib/social/proof'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema'

type StorePageProps = {
  params: { id: string }
}

type StoreReview = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

const getStoreData = async (id: string) => {
  const supabase = await createClient()
  const store = await fetchApprovedStoreById(id)

  if (!store) {
    return null
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false })

  const { data: reputation } = await supabase
    .from('vendor_reputation')
    .select('avg_rating, total_reviews, trust_score')
    .eq('vendor_id', id)
    .maybeSingle()

  const { data: reviews } = await supabase
    .from('vendor_reviews')
    .select('id, rating, review_text, created_at')
    .eq('vendor_id', id)
    .order('created_at', { ascending: false })
    .limit(3)

  return {
    store,
    products: products ?? [],
    reputation,
    reviews: (reviews ?? []) as StoreReview[],
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const data = await getStoreData(params.id)

  if (!data) {
    return buildMetadata({
      title: 'Store not found',
      description: 'The requested store could not be found.',
      path: `/stores/${params.id}`,
      noIndex: true,
    })
  }

  const storeName = data.store.store_name || data.store.business_name || 'Roorq Store'
  const description =
    data.store.store_description ||
    `${storeName} on Roorq. Browse active marketplace listings and vintage drops.`

  return buildMetadata({
    title: `${storeName} Store`,
    description,
    path: `/stores/${data.store.id}`,
    image: data.store.store_banner_url || data.store.store_logo_url || undefined,
    keywords: [storeName, data.store.business_category, 'Roorq store', 'marketplace seller'].filter(Boolean) as string[],
  })
}

export default async function StorePage({ params }: StorePageProps) {
  const data = await getStoreData(params.id)

  if (!data) {
    notFound()
  }

  const { store, products } = data
  const storeName = store.store_name || store.business_name || 'Roorq Store'
  const averageRating = Number(data.reputation?.avg_rating ?? 0)
  const totalReviews = Number(data.reputation?.total_reviews ?? 0)
  const trustScore = Number(data.reputation?.trust_score ?? 0)
  const socialProof = buildSellerSocialProof(store.id)
  const description =
    store.store_description ||
    `${storeName} on Roorq. Explore currently active listings and weekly drops.`

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <StructuredData
        data={[
          collectionSchema({
            title: `${storeName} Store`,
            description,
            path: `/stores/${store.id}`,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: storeName, path: `/stores/${store.id}` },
          ]),
        ]}
      />
      <Navbar />

      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-200 bg-white">
              {store.store_logo_url ? (
                <Image
                  src={store.store_logo_url}
                  alt={storeName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black uppercase">
                  {storeName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Marketplace Store
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-tighter">
                {storeName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-mono uppercase tracking-wide text-gray-500">
                {description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                {store.business_category && <span>{store.business_category}</span>}
                <span>{products.length} active listings</span>
                <span>{socialProof.followerCount} followers</span>
                <span>
                  {totalReviews > 0
                    ? `${averageRating.toFixed(1)}★ (${totalReviews} review${totalReviews > 1 ? 's' : ''})`
                    : 'No ratings yet'}
                </span>
                <span>Trust score {trustScore}/100</span>
              </div>
              <TrustBadgesRow badges={socialProof.badges} />
              <div className="mt-4">
                <FollowSellerButton sellerId={store.id} sellerName={storeName} />
              </div>
            </div>

            {products[0]?.id && (
              <StartConversationButton
                sellerId={store.id}
                productId={products[0].id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                label="Message store"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Trust Snapshot</p>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-3xl font-black">{totalReviews > 0 ? averageRating.toFixed(1) : '--'}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Average rating</p>
            </div>
            <div>
              <p className="text-3xl font-black">{totalReviews}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Verified reviews</p>
            </div>
            <div>
              <p className="text-3xl font-black">{trustScore}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Trust score / 100</p>
            </div>
          </div>

          {data.reviews.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {data.reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-black">{review.rating.toFixed(1)} / 5</p>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {review.review_text || 'Verified purchase. Great thrift experience.'}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-widest text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Repeat buyer rate</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{socialProof.repeatBuyerRate}%</p>
            <p className="text-xs text-stone-500">Signals consistent post-purchase satisfaction.</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">First response time</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{socialProof.responseMinutes} min</p>
            <p className="text-xs text-stone-500">Fast answers reduce checkout hesitation.</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Fulfilment score</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{socialProof.fulfilmentRate}%</p>
            <p className="text-xs text-stone-500">Orders delivered within expected timeline.</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">Moderation standards</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Review highlights prioritize verified orders. Repeated spam, abuse, or misleading claims can limit profile reach
            in search and product recommendations.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
              Seller Listings
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Active Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-black uppercase tracking-widest hover:text-gray-600"
          >
            Browse all listings
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 px-6 py-16 text-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-400">
              No active listings
            </h2>
            <p className="mt-3 text-sm font-mono uppercase tracking-wide text-gray-500">
              This store does not have any live products at the moment.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
