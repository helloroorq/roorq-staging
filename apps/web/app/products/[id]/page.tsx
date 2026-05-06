import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, MessageCircle, PackageCheck, Ruler, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AddToCartButton from '@/components/AddToCartButton'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import StructuredData from '@/components/StructuredData'
import StartConversationButton from '@/components/messages/StartConversationButton'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import ProductSaveButton from '@/components/product/ProductSaveButton'
import { logger } from '@/lib/logger'
import { fetchApprovedStoreById } from '@/lib/marketplace/public'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { buildProductSchema } from '@/lib/seo/schemas'
import { formatINR } from '@/lib/utils/currency'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const getProduct = async (id: string) => {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (error) {
    logger.error('Product detail query failed', {
      productId: id,
      message: error.message,
      code: error.code,
    })
  }

  return product
}

const getStore = async (vendorId: string | null | undefined) => {
  if (!vendorId) {
    return null
  }

  return fetchApprovedStoreById(vendorId)
}

const getVendorTrust = async (vendorId: string | null | undefined) => {
  if (!vendorId) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('vendor_reputation')
    .select('avg_rating, total_reviews, trust_score')
    .eq('vendor_id', vendorId)
    .maybeSingle()

  return data
}

const formatCondition = (condition: string | null | undefined) => {
  if (!condition) {
    return 'vintage'
  }
  return condition.replace(/_/g, ' ')
}

const titleCase = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback
  }

  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const product = await getProduct(params.id)

  if (!product) {
    return buildMetadata({
      title: 'Product not found',
      description: 'The requested product could not be found.',
      path: `/products/${params.id}`,
      noIndex: true,
    })
  }

  const productTitle = product.title ?? product.name
  const brand = product.brand ?? 'Vintage'
  const size = product.size ?? 'Free'
  const condition = formatCondition(product.condition)
  const canonical = `https://www.roorq.com/products/${product.id}`
  const title = `${brand} ${productTitle} - Size ${size} Vintage | Roorq`
  const description = `Buy this ${condition} ${brand} ${productTitle} in size ${size} on Roorq. Verified vintage, INR ${product.price}.`
  const image = product.images?.[0] ?? '/opengraph-image'

  return {
    title,
    description,
    keywords: [brand, productTitle, product.category, 'vintage clothing india'].filter(Boolean) as string[],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_IN',
      url: canonical,
      siteName: 'Roorq',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  const savings = product.retail_price
    ? Math.round(((product.retail_price - product.price) / product.retail_price) * 100)
    : 0
  const availableStock = Math.max(0, (product.stock_quantity ?? 0) - (product.reserved_quantity ?? 0))
  const store = await getStore(product.vendor_id)
  const vendorTrust = await getVendorTrust(product.vendor_id)
  const storeName = store?.store_name || store?.business_name
  const conditionLabel = titleCase(product.condition, 'Good')
  const categoryLabel = titleCase(product.category, 'Vintage')
  const shippingDays =
    typeof product.shipping_time_days === 'number' && Number.isFinite(product.shipping_time_days)
      ? Math.max(1, Math.floor(product.shipping_time_days))
      : null
  const productJsonLd = buildProductSchema({
    id: product.id,
    name: product.name,
    title: product.title,
    brand: product.brand,
    image_url: product.image_url,
    images: product.images,
    price: product.price,
    condition: product.condition,
    is_sold: product.is_sold,
    stock_quantity: product.stock_quantity,
    reserved_quantity: product.reserved_quantity,
  })

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <StructuredData
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />
      <Navbar />

      <div className="flex-1 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
          <Link href="/" className="hover:text-black">
            Home
          </Link>{' '}
          /{' '}
          <Link href="/shop" className="hover:text-black">
            Shop
          </Link>{' '}
          / <span className="text-black">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <ProductImageGallery images={product.images ?? []} productName={product.name} />
          </div>

          <div className="flex flex-col">
            <div className="border-b border-gray-100 pb-8 mb-8">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
                {product.name}
              </h1>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black tracking-tight">{formatINR(product.price)}</span>
                  {product.retail_price && product.retail_price > product.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-gray-400 line-through decoration-1">
                        {formatINR(product.retail_price)}
                      </span>
                      <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-black uppercase tracking-widest">
                        -{savings}%
                      </span>
                    </div>
                  ) : null}
                </div>
                {product.brand ? (
                  <span className="border border-black px-3 py-1 text-xs font-bold uppercase tracking-widest">
                    {product.brand}
                  </span>
                ) : null}
              </div>

              <div className="bg-gray-50 p-6 border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold uppercase tracking-widest">Size</span>
                  <Link
                    href="/sizing"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide underline text-gray-500 hover:text-black"
                  >
                    <Ruler className="w-3 h-3" /> Size Guide
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex items-center justify-center bg-black text-white text-lg font-bold border-2 border-black">
                    {product.size || 'F'}
                  </div>
                  <span className="text-xs text-gray-500 font-mono uppercase">
                    {availableStock > 0 ? `${availableStock} item${availableStock > 1 ? 's' : ''} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-3 text-xs font-semibold uppercase tracking-wide">
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">
                  Condition: <span className="text-black">{conditionLabel}</span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">
                  Category: <span className="text-black">{categoryLabel}</span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">
                  Brand: <span className="text-black">{product.brand || 'Vintage'}</span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">
                  Dispatch:{' '}
                  <span className="text-black">
                    {shippingDays ? `${shippingDays} day${shippingDays > 1 ? 's' : ''}` : 'Fast dispatch'}
                  </span>
                </div>
              </div>

              {store && storeName ? (
                <div className="mb-8 border border-gray-100 bg-white p-6">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Sold by</p>
                  <Link
                    href={`/stores/${store.id}`}
                    className="inline-flex items-center gap-3 text-lg font-black uppercase tracking-wide hover:text-gray-600"
                  >
                    {storeName}
                  </Link>
                  {store.store_description ? (
                    <p className="mt-3 text-xs font-mono uppercase tracking-wide text-gray-500">
                      {store.store_description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    <span>
                      {Number(vendorTrust?.avg_rating ?? 0) > 0
                        ? `${Number(vendorTrust?.avg_rating).toFixed(1)}★`
                        : 'New seller'}
                    </span>
                    <span>
                      {Number(vendorTrust?.total_reviews ?? 0)} review
                      {Number(vendorTrust?.total_reviews ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span>Trust {Number(vendorTrust?.trust_score ?? 0)}/100</span>
                  </div>
                </div>
              ) : null}

              <div className="mb-8">
                <div className="space-y-3">
                  <AddToCartButton productId={product.id} disabled={availableStock === 0} />
                  <ProductSaveButton productId={product.id} productName={product.name} />
                  {product.vendor_id ? (
                    <StartConversationButton
                      sellerId={product.vendor_id}
                      productId={product.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-gray-300 hover:bg-gray-50"
                    />
                  ) : null}
                </div>
                {availableStock === 0 ? (
                  <p className="mt-2 text-red-600 text-xs font-bold uppercase tracking-widest text-center">Sold Out</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Verified Listing</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Only approved and active products appear in this marketplace feed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PackageCheck className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Stock Clarity</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Live stock status helps you avoid checkout surprises.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Seller Chat</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Ask for extra photos and fit details before placing your order.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">Secure Flow</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Save, cart, and checkout actions stay consistent across desktop and mobile.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed font-mono text-xs">
                {product.description || 'No description available for this item.'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs font-mono uppercase text-gray-500">
                <div>
                  <span className="font-bold text-black">Material:</span> {product.material || 'N/A'}
                </div>
                <div>
                  <span className="font-bold text-black">Color:</span> {product.color || 'N/A'}
                </div>
                <div>
                  <span className="font-bold text-black">Category:</span> {categoryLabel}
                </div>
                <div>
                  <span className="font-bold text-black">Condition:</span> {conditionLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

