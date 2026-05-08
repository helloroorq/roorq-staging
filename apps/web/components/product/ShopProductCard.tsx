'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { formatINR } from '@/lib/utils/currency'
import { readWishlistIds, toggleWishlistId, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

type ShopProductCardProduct = {
  id: string
  slug?: string | null
  name: string
  title?: string | null
  brand?: string | null
  images?: string[] | null
  image_url?: string | null
  category?: string | null
  size?: string | null
  price: number | null
  is_sold?: boolean | null
  reserved_quantity?: number | null
  stock_quantity?: number | null
}

const FALLBACK_IMAGE = '/roorq-final7.png'

const isOutOfStock = (product: ShopProductCardProduct) => {
  if (typeof product.is_sold === 'boolean' && product.is_sold) {
    return true
  }
  const stock = Math.max(0, Number(product.stock_quantity ?? 0))
  const reserved = Math.max(0, Number(product.reserved_quantity ?? 0))
  return stock - reserved <= 0
}

export default function ShopProductCard({ product }: { product: ShopProductCardProduct }) {
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const sync = () => setIsLiked(readWishlistIds().includes(product.id))
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(WISHLIST_UPDATED_EVENT, sync as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, sync as EventListener)
    }
  }, [product.id])

  const slug = product.slug || product.id
  const title = (product.title || product.name || '').toUpperCase()
  const brand = product.brand || 'Vintage'
  const size = product.size || 'Free'
  const price = Number(product.price ?? 0)
  const imageUrl = product.image_url || product.images?.[0] || FALLBACK_IMAGE
  const sold = isOutOfStock(product)

  const triggerLike = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    toggleWishlistId(product.id, isLiked)
    setIsLiked((current) => !current)
  }

  return (
    <article className="relative">
      <Link href={`/products/${slug}`} className="group block" aria-label={`${title}, ${formatINR(price)}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-rq-bg">
          <Image
            src={imageUrl}
            alt={`${title} – ${brand}`}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {sold ? (
            <div className="absolute inset-0 flex items-center justify-center bg-rq-ink/50">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rq-brand-ink">Sold</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="line-clamp-1 text-[12px] font-bold uppercase tracking-[0.04em] text-rq-ink">
            {title}
          </h3>
          <p className="mt-1 text-[11px] text-rq-ink-muted">
            {size} · {brand}
          </p>
          <p className="mt-1.5 text-[14px] font-bold text-rq-brand">{formatINR(price)}</p>
        </div>
      </Link>

      <button
        type="button"
        aria-label={`Save ${title}`}
        aria-pressed={isLiked}
        onClick={triggerLike}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            triggerLike(event)
          }
        }}
        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rq-line bg-rq-surface/95 transition hover:scale-105"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isLiked ? 'fill-rq-brand text-rq-brand' : 'text-rq-ink'
          }`}
        />
      </button>
    </article>
  )
}
