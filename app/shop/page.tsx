import Link from 'next/link'
import { ChevronDown, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import StructuredData from '@/components/StructuredData'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { buildMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema'

export const metadata = buildMetadata({
  title: 'Shop',
  description: 'Shop the latest weekly drops and vintage pieces curated for IIT Roorkee.',
  path: '/shop',
  keywords: ['shop', 'weekly drops', 'vintage', 'IIT Roorkee'],
})

type ShopSearchParams = {
  category?: string
  search?: string
  sort?: string
  gender?: string
  tag?: string
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams
}) {
  const supabase = await createClient()

  let query = supabase.from('products').select('*').eq('is_active', true).eq('approval_status', 'approved')

  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }

  if (searchParams.gender) {
    query = query.eq('gender', searchParams.gender)
  }

  const searchTerm = searchParams.search ?? searchParams.tag
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
  }

  switch (searchParams.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'bestsellers':
      query = query.order('created_at', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data: products, error } = await query

  if (error) {
    logger.error('Error fetching products', error instanceof Error ? error : undefined)
  }

  const categoryLabels: Record<string, string> = {
    't-shirt': 'T-Shirts',
    jacket: 'Jackets',
    sweater: 'Sweaters',
    jeans: 'Jeans',
    trousers: 'Trousers',
    shoes: 'Shoes',
    accessories: 'Accessories',
    skirt: 'Skirts',
    sportswear: 'Sportswear',
    sale: 'Sale',
  }

  const genderLabels: Record<string, string> = {
    men: "Men's",
    women: "Women's",
    kids: "Kids'",
  }

  const genderLabel = searchParams.gender
    ? (genderLabels[searchParams.gender] ?? `${searchParams.gender}'s`)
    : ''
  const categoryLabel = searchParams.category
    ? (categoryLabels[searchParams.category] ?? searchParams.category)
    : 'All Vintage'

  const categories = [
    { name: 'All', value: '' },
    { name: 'Jackets', value: 'jacket' },
    { name: 'Sweaters', value: 'sweater' },
    { name: 'T-Shirts', value: 't-shirt' },
    { name: 'Jeans', value: 'jeans' },
    { name: 'Skirts', value: 'skirt' },
    { name: 'Trousers', value: 'trousers' },
    { name: 'Shoes', value: 'shoes' },
    { name: 'Accessories', value: 'accessories' },
    { name: 'Sportswear', value: 'sportswear' },
  ]

  const buildShopHref = (overrides: Partial<ShopSearchParams>) => {
    const params = new URLSearchParams()
    const merged = { ...searchParams, ...overrides }

    Object.entries(merged).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        params.set(key, value)
      }
    })

    return `/shop${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <StructuredData
        data={[
          collectionSchema({
            title: 'Roorq Shop',
            description: 'Weekly drops and vintage fashion curated for IIT Roorkee.',
            path: '/shop',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
          ]),
        ]}
      />
      <Navbar />

      <div className="border-b border-gray-200 bg-gray-100 px-4 py-12 text-center">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter md:text-6xl">
          {genderLabel ? `${genderLabel} ` : ''}
          {categoryLabel}
        </h1>
        <p className="mx-auto max-w-2xl text-xs font-mono uppercase tracking-widest text-gray-500 md:text-sm">
          {products?.length || 0} Items Found • 100% Authentic • Cleaned & Ready to Wear
        </p>
      </div>

      <div className="mx-auto flex-1 w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="sticky top-20 z-30 mb-8 flex flex-col items-center justify-between gap-4 border-b border-gray-100 bg-white py-4 md:flex-row">
          <div className="hidden flex-wrap gap-2 md:flex">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={buildShopHref({ category: category.value })}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border ${
                  searchParams.category === category.value || (!searchParams.category && category.value === '')
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-black hover:border-black'
                } transition-colors`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="flex w-full items-center gap-4 md:w-auto">
            <div className="group relative w-full md:w-48">
              <button className="flex w-full items-center justify-between border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide">
                <span>Sort By</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full z-40 hidden w-full border border-black border-t-0 bg-white group-hover:block">
                {[
                  { label: 'Newest Arrivals', value: 'newest' },
                  { label: 'Price: Low to High', value: 'price_asc' },
                  { label: 'Price: High to Low', value: 'price_desc' },
                ].map((option) => (
                  <Link
                    key={option.value}
                    href={buildShopHref({ sort: option.value })}
                    className="block px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100"
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 md:hidden no-scrollbar">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={buildShopHref({ category: category.value })}
              className={`flex-shrink-0 border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                searchParams.category === category.value || (!searchParams.category && category.value === '')
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 bg-white text-black'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">No products found</h3>
            <p className="mt-2 max-w-md text-sm font-mono text-gray-500">
              {error ? 'There was a problem loading products.' : "We couldn't find any items matching your filters."}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block bg-black px-8 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Clear All Filters
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
