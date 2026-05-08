import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown, X } from 'lucide-react'
import Footer from '@/components/Footer'
import ShopProductCard from '@/components/product/ShopProductCard'
import StructuredData from '@/components/StructuredData'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/schema'
import { escapeIlikeValue, sanitizeSearchQuery } from '@/lib/search/query'

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
  key: 'gender' | 'category' | 'brand' | 'size' | 'condition' | 'minPrice' | 'maxPrice' | 'stock' | 'q'
}

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const PAGE_SIZE = 30

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const numericValue = Number.parseInt(value, 10)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback
}

const buildCanonicalQuery = (searchParams: MetadataSearchParams) => {
  const canonicalParams = new URLSearchParams()
  const canonicalKeys = ['category', 'gender', 'brand', 'q', 'size', 'condition', 'minPrice', 'maxPrice', 'stock'] as const

  canonicalKeys.forEach((key) => {
    const value = getFirstParam(searchParams[key])
    if (value) canonicalParams.set(key, value)
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

const POPULAR_BRANDS = [
  'Nike',
  'Adidas',
  'BAPE',
  'Ralph Lauren',
  'Stüssy',
  'Supreme',
  'Champion',
  'Carhartt',
  'Tommy Hilfiger',
  "Levi's",
  'Polo',
  'Nautica',
  'Calvin Klein',
  'Diesel',
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'bestsellers', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
]

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
  if (minPrice > 0) query = query.gte('price', minPrice)

  const maxPrice = parsePositiveInt(resolvedSearchParams.maxPrice, 0)
  if (maxPrice > 0) query = query.lte('price', maxPrice)

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
      ? { label: capitalize(resolvedSearchParams.gender), key: 'gender' as const }
      : null,
    resolvedSearchParams.category
      ? { label: categoryLabel, key: 'category' as const }
      : null,
    resolvedSearchParams.brand
      ? { label: resolvedSearchParams.brand, key: 'brand' as const }
      : null,
    resolvedSearchParams.size
      ? { label: `Size ${resolvedSearchParams.size}`, key: 'size' as const }
      : null,
    resolvedSearchParams.condition
      ? { label: resolvedSearchParams.condition.replace('_', ' '), key: 'condition' as const }
      : null,
    resolvedSearchParams.minPrice ? { label: `Min ₹${resolvedSearchParams.minPrice}`, key: 'minPrice' as const } : null,
    resolvedSearchParams.maxPrice ? { label: `Max ₹${resolvedSearchParams.maxPrice}`, key: 'maxPrice' as const } : null,
    resolvedSearchParams.stock === 'in_stock' ? { label: 'In stock', key: 'stock' as const } : null,
    searchTerm ? { label: `“${searchTerm}”`, key: 'q' as const } : null,
  ].filter((filter): filter is ActiveFilter => filter !== null)

  const headingLabel = (genderLabel ? `${genderLabel} ${categoryLabel}` : categoryLabel).toUpperCase()
  const piecesLabel = `${totalResults.toLocaleString('en-IN')} ${totalResults === 1 ? 'PIECE' : 'PIECES'}`
  const currentSortValue = resolvedSearchParams.sort ?? 'newest'
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === currentSortValue)?.label ?? 'Newest'

  const chipBase =
    'inline-flex items-center gap-1 rounded-full border border-rq-line bg-rq-surface px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-rq-ink hover:border-rq-ink transition cursor-pointer'
  const chipActive =
    'inline-flex items-center gap-1 rounded-full border border-rq-ink bg-rq-ink px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-rq-brand-ink cursor-pointer'

  const renderDropdown = (children: React.ReactNode) => (
    <div className="absolute left-0 top-[calc(100%+8px)] z-30 max-h-80 w-64 overflow-y-auto rounded-2xl border border-rq-line bg-rq-surface p-2 shadow-[0_18px_40px_rgba(15,15,15,0.12)]">
      {children}
    </div>
  )

  const dropdownItem = (active: boolean) =>
    `flex items-center justify-between rounded-xl px-3 py-2 text-[13px] ${
      active ? 'bg-rq-ink text-rq-brand-ink' : 'text-rq-ink hover:bg-rq-bg'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-rq-bg font-sans text-rq-ink">
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

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <h1 className="text-[22px] font-black uppercase tracking-tight text-rq-ink md:text-[28px]">
          {headingLabel} · {piecesLabel}
        </h1>

        <div className="mt-1 flex items-center justify-between text-[12px] text-rq-ink-muted">
          <span>{piecesLabel.toLowerCase()}</span>

          <details className="no-marker relative">
            <summary className="inline-flex cursor-pointer items-center gap-1 text-[12px] text-rq-ink-muted hover:text-rq-ink">
              Sort: <span className="font-semibold text-rq-ink">{currentSortLabel}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-2xl border border-rq-line bg-rq-surface p-2 shadow-[0_18px_40px_rgba(15,15,15,0.12)]">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={buildShopHref({ sort: option.value })}
                  className={dropdownItem(currentSortValue === option.value)}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </details>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <details className="no-marker relative">
            <summary className={resolvedSearchParams.gender ? chipActive : chipBase}>
              Gender
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            {renderDropdown(
              <>
                {genders.map((gender) => (
                  <Link
                    key={gender.value || 'all-genders'}
                    href={buildShopHref({ gender: gender.value })}
                    className={dropdownItem((resolvedSearchParams.gender ?? '') === gender.value)}
                  >
                    {gender.name}
                  </Link>
                ))}
              </>
            )}
          </details>

          <details className="no-marker relative">
            <summary className={resolvedSearchParams.category ? chipActive : chipBase}>
              Category
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            {renderDropdown(
              <>
                {categories.map((category) => (
                  <Link
                    key={category.value || 'all-categories'}
                    href={buildShopHref({ category: category.value })}
                    className={dropdownItem((resolvedSearchParams.category ?? '') === category.value)}
                  >
                    {category.name}
                  </Link>
                ))}
              </>
            )}
          </details>

          <details className="no-marker relative">
            <summary className={resolvedSearchParams.brand ? chipActive : chipBase}>
              Brand
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            {renderDropdown(
              <>
                <Link
                  href={buildShopHref({ brand: '' })}
                  className={dropdownItem(!resolvedSearchParams.brand)}
                >
                  All brands
                </Link>
                {POPULAR_BRANDS.map((brand) => (
                  <Link
                    key={brand}
                    href={buildShopHref({ brand })}
                    className={dropdownItem(resolvedSearchParams.brand === brand)}
                  >
                    {brand}
                  </Link>
                ))}
              </>
            )}
          </details>

          <details className="no-marker relative">
            <summary
              className={resolvedSearchParams.minPrice || resolvedSearchParams.maxPrice ? chipActive : chipBase}
            >
              Price
              <ChevronDown className="h-3.5 w-3.5" />
            </summary>
            <form
              action="/shop"
              method="get"
              className="absolute left-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-rq-line bg-rq-surface p-3 shadow-[0_18px_40px_rgba(15,15,15,0.12)]"
            >
              {(['category', 'brand', 'q', 'sort', 'gender', 'size', 'condition', 'stock'] as const).map((key) => {
                const value = resolvedSearchParams[key]
                return value ? <input key={key} type="hidden" name={key} value={value} /> : null
              })}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-rq-ink-muted">
                  Min ₹
                  <input
                    type="number"
                    name="minPrice"
                    min="0"
                    inputMode="numeric"
                    defaultValue={resolvedSearchParams.minPrice ?? ''}
                    className="mt-1 h-10 w-full rounded-xl border border-rq-line bg-rq-surface px-3 text-sm text-rq-ink outline-none focus:border-rq-ink"
                  />
                </label>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-rq-ink-muted">
                  Max ₹
                  <input
                    type="number"
                    name="maxPrice"
                    min="0"
                    inputMode="numeric"
                    defaultValue={resolvedSearchParams.maxPrice ?? ''}
                    className="mt-1 h-10 w-full rounded-xl border border-rq-line bg-rq-surface px-3 text-sm text-rq-ink outline-none focus:border-rq-ink"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-3 h-10 w-full rounded-xl bg-rq-brand text-[12px] font-bold uppercase tracking-[0.16em] text-rq-brand-ink"
              >
                Apply
              </button>
            </form>
          </details>
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <Link
                key={filter.key}
                href={buildShopHref({ [filter.key]: '' })}
                className="inline-flex items-center gap-1 rounded-full border border-rq-line bg-rq-surface px-3 py-1.5 text-[11px] text-rq-ink hover:border-rq-ink"
              >
                {filter.label}
                <X className="h-3 w-3" />
              </Link>
            ))}
            <Link
              href="/shop"
              className="text-[11px] font-bold uppercase tracking-wide text-rq-ink-muted underline underline-offset-2 hover:text-rq-ink"
            >
              Clear all
            </Link>
          </div>
        ) : null}

        <div className="mt-6">
          {products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-rq-line pt-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rq-ink-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={buildShopHref({ page: currentPage > 1 ? String(currentPage - 1) : '1' })}
                    aria-disabled={currentPage <= 1}
                    className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wide ${
                      currentPage <= 1
                        ? 'pointer-events-none border-rq-line text-rq-ink-muted/50'
                        : 'border-rq-ink text-rq-ink'
                    }`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={buildShopHref({
                      page: currentPage < totalPages ? String(currentPage + 1) : String(totalPages),
                    })}
                    aria-disabled={currentPage >= totalPages}
                    className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wide ${
                      currentPage >= totalPages
                        ? 'pointer-events-none border-rq-line text-rq-ink-muted/50'
                        : 'border-rq-ink text-rq-ink'
                    }`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-xl font-black uppercase tracking-widest text-rq-ink-muted">No products found</h3>
              <p className="mt-2 max-w-md text-sm text-rq-ink-muted">
                {error ? 'There was a problem loading products.' : "We couldn't find any items matching your filters."}
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-rq-brand px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-rq-brand-ink"
              >
                Clear All Filters
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
