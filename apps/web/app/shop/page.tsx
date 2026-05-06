import type { Metadata } from 'next'
import Link from 'next/link'
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import StructuredData from '@/components/StructuredData'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema'
import { escapeIlikeValue, sanitizeSearchQuery } from '@/lib/search/query'

// Shop is highly variable (filters/search) but the underlying products list mutates infrequently;
// 60s ISR makes filtered pages near-instant while letting new listings surface within a minute.
export const revalidate = 60

type MetadataSearchParams = Record<string, string | string[] | undefined>

type ShopSearchParams = {
  category?: string
  brand?: string
  search?: string
  q?: string
  sort?: string
  gender?: string
  tag?: string
  size?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  stock?: string
  page?: string
}

type ActiveFilter = {
  label: string
  key: 'gender' | 'category' | 'size' | 'condition' | 'minPrice' | 'maxPrice' | 'stock' | 'q'
}

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const PAGE_SIZE = 30

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }

  const numericValue = Number.parseInt(value, 10)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback
}

const buildCanonicalQuery = (searchParams: MetadataSearchParams) => {
  const canonicalParams = new URLSearchParams()
  const canonicalKeys = ['category', 'gender', 'brand', 'q', 'size', 'condition', 'minPrice', 'maxPrice', 'stock'] as const

  canonicalKeys.forEach((key) => {
    const value = getFirstParam(searchParams[key])
    if (value) {
      canonicalParams.set(key, value)
    }
  })

  const query = canonicalParams.toString()
  return query ? `?${query}` : ''
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: MetadataSearchParams
}): Promise<Metadata> {
  const category = getFirstParam(searchParams.category)
  const gender = getFirstParam(searchParams.gender)
  const brand = getFirstParam(searchParams.brand)
  const q = getFirstParam(searchParams.q) ?? getFirstParam(searchParams.search)

  const titleParts = ['Shop Vintage']
  if (brand) titleParts.push(brand)
  if (category) titleParts.push(capitalize(category))
  if (gender) titleParts.push(`${capitalize(gender)}'s`)
  titleParts.push('Clothing India')

  return {
    title: titleParts.join(' '),
    description: `Browse authentic vintage ${category || 'clothing'} on Roorq with fast filters for size, condition, and price.${q ? ` Search: ${q}.` : ''}`,
    alternates: {
      canonical: `https://www.roorq.com/shop${buildCanonicalQuery(searchParams)}`,
    },
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: MetadataSearchParams
}) {
  const resolvedSearchParams: ShopSearchParams = {
    category: getFirstParam(searchParams.category),
    brand: getFirstParam(searchParams.brand),
    search: getFirstParam(searchParams.search),
    q: getFirstParam(searchParams.q),
    sort: getFirstParam(searchParams.sort),
    gender: getFirstParam(searchParams.gender),
    tag: getFirstParam(searchParams.tag),
    size: getFirstParam(searchParams.size),
    condition: getFirstParam(searchParams.condition),
    minPrice: getFirstParam(searchParams.minPrice),
    maxPrice: getFirstParam(searchParams.maxPrice),
    stock: getFirstParam(searchParams.stock),
    page: getFirstParam(searchParams.page),
  }
  const currentPage = parsePositiveInt(resolvedSearchParams.page, 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (resolvedSearchParams.category) {
    if (resolvedSearchParams.category === 'sale') {
      query = query.gt('retail_price', 0)
    } else {
      query = query.eq('category', resolvedSearchParams.category)
    }
  }

  if (resolvedSearchParams.gender) {
    query = query.eq('gender', resolvedSearchParams.gender)
  }

  if (resolvedSearchParams.brand) {
    query = query.ilike('brand', `%${resolvedSearchParams.brand}%`)
  }

  if (resolvedSearchParams.size) {
    query = query.eq('size', resolvedSearchParams.size)
  }

  if (resolvedSearchParams.condition) {
    query = query.eq('condition', resolvedSearchParams.condition)
  }

  const minPrice = parsePositiveInt(resolvedSearchParams.minPrice, 0)
  if (minPrice > 0) {
    query = query.gte('price', minPrice)
  }

  const maxPrice = parsePositiveInt(resolvedSearchParams.maxPrice, 0)
  if (maxPrice > 0) {
    query = query.lte('price', maxPrice)
  }

  if (resolvedSearchParams.stock === 'in_stock') {
    query = query.gt('stock_quantity', 0)
  }

  const rawSearchTerm = resolvedSearchParams.q ?? resolvedSearchParams.search ?? resolvedSearchParams.tag
  const searchTerm = rawSearchTerm ? sanitizeSearchQuery(rawSearchTerm) : ''
  if (searchTerm) {
    const escapedSearchTerm = escapeIlikeValue(searchTerm)
    query = query.or(
      `name.ilike.%${escapedSearchTerm}%,description.ilike.%${escapedSearchTerm}%,brand.ilike.%${escapedSearchTerm}%`
    )
  }

  switch (resolvedSearchParams.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'bestsellers':
      query = query.order('sales_count', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }
  query = query.range(from, to)

  const { data: products, error, count } = await query

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

  const genderLabel = resolvedSearchParams.gender
    ? (genderLabels[resolvedSearchParams.gender] ?? `${resolvedSearchParams.gender}'s`)
    : ''
  const categoryLabel = resolvedSearchParams.category
    ? (categoryLabels[resolvedSearchParams.category] ?? resolvedSearchParams.category)
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

  const genders = [
    { name: 'All', value: '' },
    { name: 'Men', value: 'men' },
    { name: 'Women', value: 'women' },
    { name: 'Kids', value: 'kids' },
  ]
  const conditionOptions = [
    { label: 'Any condition', value: '' },
    { label: 'Like new', value: 'like_new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' },
  ]
  const sizeOptions = [
    { label: 'Any size', value: '' },
    { label: 'XS', value: 'XS' },
    { label: 'S', value: 'S' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' },
    { label: 'XL', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
    { label: 'Free size', value: 'Free' },
  ]
  const totalResults = count ?? products?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))

  const buildShopHref = (overrides: Partial<ShopSearchParams>) => {
    const params = new URLSearchParams()
    const merged = { ...resolvedSearchParams, ...overrides }

    Object.entries(merged).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim().length > 0) {
        params.set(key, value)
      }
    })

    return `/shop${params.toString() ? `?${params.toString()}` : ''}`
  }

  const activeFilters = [
    resolvedSearchParams.gender
      ? { label: `Gender: ${capitalize(resolvedSearchParams.gender)}`, key: 'gender' as const }
      : null,
    resolvedSearchParams.category
      ? { label: `Category: ${categoryLabel}`, key: 'category' as const }
      : null,
    resolvedSearchParams.size
      ? { label: `Size: ${resolvedSearchParams.size}`, key: 'size' as const }
      : null,
    resolvedSearchParams.condition
      ? { label: `Condition: ${resolvedSearchParams.condition.replace('_', ' ')}`, key: 'condition' as const }
      : null,
    resolvedSearchParams.minPrice ? { label: `Min ₹${resolvedSearchParams.minPrice}`, key: 'minPrice' as const } : null,
    resolvedSearchParams.maxPrice ? { label: `Max ₹${resolvedSearchParams.maxPrice}`, key: 'maxPrice' as const } : null,
    resolvedSearchParams.stock === 'in_stock' ? { label: 'In stock', key: 'stock' as const } : null,
    searchTerm ? { label: `Search: ${searchTerm}`, key: 'q' as const } : null,
  ].filter((filter): filter is ActiveFilter => filter !== null)

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

      <div className="border-b border-gray-200 bg-gray-100 px-4 py-10 text-center md:py-12">
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter md:text-6xl">
          {genderLabel ? `${genderLabel} ` : ''}
          {categoryLabel}
        </h1>
        <p className="mx-auto max-w-3xl text-xs font-mono uppercase tracking-widest text-gray-500 md:text-sm">
          {totalResults} Items found - verified vintage listings - filter by size, condition, and price in seconds
        </p>
      </div>

      <div className="mx-auto flex-1 w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Browse faster
          </div>
          <Link href="/saved" className="text-xs font-bold uppercase tracking-wide underline-offset-2 hover:underline">
            View saved
          </Link>
        </div>

        <form action="/shop" className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-6">
          <label className="relative block lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={searchTerm ?? ''}
              placeholder="Search by product, brand, or vibe"
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none transition focus:border-black"
            />
          </label>

          <select
            name="gender"
            defaultValue={resolvedSearchParams.gender ?? ''}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
          >
            {genders.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.name}
              </option>
            ))}
          </select>

          <select
            name="size"
            defaultValue={resolvedSearchParams.size ?? ''}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
          >
            {sizeOptions.map((sizeOption) => (
              <option key={sizeOption.value} value={sizeOption.value}>
                {sizeOption.label}
              </option>
            ))}
          </select>

          <select
            name="condition"
            defaultValue={resolvedSearchParams.condition ?? ''}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
          >
            {conditionOptions.map((conditionOption) => (
              <option key={conditionOption.value} value={conditionOption.value}>
                {conditionOption.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-black px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
          >
            Apply filters
          </button>

          <div className="grid grid-cols-2 gap-3 md:col-span-2 lg:col-span-3">
            <input
              type="number"
              name="minPrice"
              min="0"
              defaultValue={resolvedSearchParams.minPrice ?? ''}
              placeholder="Min price"
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
            />
            <input
              type="number"
              name="maxPrice"
              min="0"
              defaultValue={resolvedSearchParams.maxPrice ?? ''}
              placeholder="Max price"
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <select
              name="sort"
              defaultValue={resolvedSearchParams.sort ?? 'newest'}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-black"
            >
              <option value="newest">Newest arrivals</option>
              <option value="bestsellers">Most popular</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
            </select>
          </div>

          <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm md:col-span-2 lg:col-span-1">
            <input
              type="checkbox"
              name="stock"
              value="in_stock"
              defaultChecked={resolvedSearchParams.stock === 'in_stock'}
              className="h-4 w-4 accent-black"
            />
            In stock only
          </label>
        </form>

        <div className="sticky top-14 z-30 mb-6 flex flex-col gap-4 border-b border-gray-100 bg-white py-3 md:top-24">
          <div className="flex flex-wrap gap-2">
            {genders.map((gender) => (
              <Link
                key={gender.value || 'all-genders'}
                href={buildShopHref({ gender: gender.value })}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border rounded-full ${
                  (resolvedSearchParams.gender ?? '') === gender.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-black hover:border-black'
                } transition-colors`}
              >
                {gender.name}
              </Link>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={buildShopHref({ category: category.value })}
                className={`flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wide border rounded-full ${
                  resolvedSearchParams.category === category.value || (!resolvedSearchParams.category && category.value === '')
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 bg-white text-black hover:border-black'
                } transition-colors`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <Link
                key={filter.key}
                href={buildShopHref({ [filter.key]: '' })}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs"
              >
                {filter.label}
                <X className="h-3.5 w-3.5" />
              </Link>
            ))}
            <Link href="/shop" className="text-xs font-bold uppercase tracking-wide underline underline-offset-2">
              Clear all
            </Link>
          </div>
        ) : null}

        {products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
              <span className="text-xs font-mono uppercase tracking-wider text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Link
                  href={buildShopHref({ page: currentPage > 1 ? String(currentPage - 1) : '1' })}
                  aria-disabled={currentPage <= 1}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                    currentPage <= 1 ? 'pointer-events-none border-gray-200 text-gray-300' : 'border-black text-black'
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={buildShopHref({ page: currentPage < totalPages ? String(currentPage + 1) : String(totalPages) })}
                  aria-disabled={currentPage >= totalPages}
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                    currentPage >= totalPages ? 'pointer-events-none border-gray-200 text-gray-300' : 'border-black text-black'
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </>
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
