'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import Footer from '@/components/Footer'
import ProductCard, { type LegacyProduct } from '@/components/ProductCard'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/client'
import { readWishlistIds, WISHLIST_UPDATED_EVENT, writeWishlistIds } from '@/lib/wishlist'

export default function SavedProductsClient() {
  const supabase = useMemo(() => createClient(), [])
  const requestIdRef = useRef(0)
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [products, setProducts] = useState<LegacyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const syncWishlistIds = useCallback(() => {
    setWishlistIds(readWishlistIds())
  }, [])

  const loadSavedProducts = useCallback(
    async (ids: string[]) => {
      const requestId = ++requestIdRef.current

      if (ids.length === 0) {
        setProducts([])
        setErrorMessage(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage(null)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .eq('is_active', true)
        .eq('approval_status', 'approved')

      if (requestId !== requestIdRef.current) {
        return
      }

      if (error) {
        logger.error('Failed to load saved products', error instanceof Error ? error : undefined)
        setErrorMessage('Failed to load your saved items. Please try again.')
        setLoading(false)
        return
      }

      const savedProducts = (data ?? []) as LegacyProduct[]
      const productMap = new Map(savedProducts.map((product) => [product.id, product]))
      const orderedProducts = ids
        .map((id) => productMap.get(id))
        .filter((product): product is LegacyProduct => Boolean(product))

      const availableIds = orderedProducts.map((product) => product.id)

      setProducts(orderedProducts)
      setLoading(false)

      if (availableIds.length !== ids.length) {
        writeWishlistIds(availableIds)
      }
    },
    [supabase]
  )

  useEffect(() => {
    syncWishlistIds()
    window.addEventListener('storage', syncWishlistIds)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistIds as EventListener)

    return () => {
      window.removeEventListener('storage', syncWishlistIds)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistIds as EventListener)
    }
  }, [syncWishlistIds])

  useEffect(() => {
    void loadSavedProducts(wishlistIds)
  }, [loadSavedProducts, wishlistIds])

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-neutral-100 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Saved</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">Your wishlist</h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-500">
                Save products from any grid and they appear here immediately.
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 py-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-neutral-100 bg-white">
                <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
                <div className="space-y-3 px-[10px] pb-3 pt-[10px]">
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-100" />
                    <div className="h-4 w-14 animate-pulse rounded bg-neutral-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold text-black">Could not load saved items.</p>
            <p className="mt-2 text-sm text-neutral-500">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                syncWishlistIds()
              }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading && !errorMessage && wishlistIds.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <Heart className="h-5 w-5" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-black">Nothing saved yet.</h2>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Tap the heart on any product card and it will show up here straight away.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Browse the shop
            </Link>
          </div>
        ) : null}

        {!loading && !errorMessage && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 py-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      <Footer />
    </div>
  )
}
