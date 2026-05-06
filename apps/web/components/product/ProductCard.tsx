'use client'

import Image from 'next/image'
import Link from 'next/link'
import { memo, type KeyboardEvent, type MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { formatINR } from '@/lib/utils/currency'

export interface ProductCardProps {
  id: string
  slug: string
  title: string
  brand: string
  category: string
  price: number
  size: string
  condition: 'like_new' | 'good' | 'fair' | 'well_loved'
  imageUrl: string
  isSold: boolean
  inventoryLeft?: number | null
  isLiked: boolean
  seller: {
    id: string
    username: string
    avatarUrl: string | null
  }
  socialProof?: {
    averageRating: number
    reviewCount: number
    saveCount: number
  }
  onLike: (id: string, current: boolean) => void
}

const FALLBACK_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgNjAwIDgwMCI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4="

const getSellerInitials = (username: string) =>
  username
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'R'

const formatConditionLabel = (condition: ProductCardProps['condition']) => {
  switch (condition) {
    case 'like_new':
      return 'Like new'
    case 'well_loved':
      return 'Well loved'
    case 'fair':
      return 'Fair'
    case 'good':
    default:
      return 'Good'
  }
}

function ProductCardComponent({
  id,
  slug,
  title,
  brand,
  category,
  price,
  size,
  condition,
  imageUrl,
  isSold,
  inventoryLeft,
  isLiked,
  seller,
  socialProof,
  onLike,
}: ProductCardProps) {
  const productHref = `/products/${slug}`
  const priceLabel = formatINR(price)
  const linkLabel = `${title} by ${seller.username}, ${priceLabel}`
  const imageAlt = `${title} - ${brand} vintage ${category} size ${size} | Roorq`
  const sellerInitials = getSellerInitials(seller.username)
  const conditionLabel = formatConditionLabel(condition)

  const triggerLike = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onLike(id, isLiked)
  }

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white"
      itemScope
      itemType="https://schema.org/Product"
    >
      <meta itemProp="brand" content={brand} />
      <meta itemProp="category" content={category} />
      <meta itemProp="image" content={imageUrl} />
      <meta itemProp="url" content={productHref} />
      <meta itemProp="description" content={`${brand} vintage ${category} in size ${size}. Condition: ${conditionLabel}.`} />

      <Link
        href={productHref}
        aria-label={linkLabel}
        className="group flex h-full flex-col transition-transform duration-100 active:scale-[0.97]"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw"
            placeholder="blur"
            blurDataURL={FALLBACK_BLUR_DATA_URL}
            className="object-cover"
            itemProp="image"
          />

          {isSold ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Sold</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-[10px] pb-3 pt-[10px]">
          <div className="flex items-center gap-1.5">
            {seller.avatarUrl ? (
              <div className="relative h-[18px] w-[18px] overflow-hidden rounded-full bg-neutral-100">
                <Image src={seller.avatarUrl} alt={`${seller.username} avatar`} fill sizes="18px" className="object-cover" />
              </div>
            ) : (
              <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-neutral-100 text-[9px] font-semibold text-neutral-600">
                {sellerInitials}
              </span>
            )}

            <span className="truncate text-[11px] text-neutral-500">{seller.username}</span>
          </div>

          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 text-neutral-950" itemProp="name">
            {title}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700">
              {size}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium capitalize text-amber-700">
              {conditionLabel}
            </span>
            <span className="text-[14px] font-semibold text-neutral-950">{priceLabel}</span>
          </div>

          {!isSold && typeof inventoryLeft === 'number' && inventoryLeft > 0 && inventoryLeft <= 3 ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600">
              Only {inventoryLeft} left
            </p>
          ) : null}

          {socialProof ? (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              <span className="rounded-full bg-stone-100 px-2 py-1">{socialProof.averageRating}★ rating</span>
              <span className="rounded-full bg-stone-100 px-2 py-1">{socialProof.reviewCount} reviews</span>
              <span className="rounded-full bg-stone-100 px-2 py-1">{socialProof.saveCount} saves</span>
            </div>
          ) : null}

          <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="INR" />
            <meta itemProp="price" content={String(price)} />
            <meta
              itemProp="availability"
              content={isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock'}
            />
          </div>
        </div>
      </Link>

      <button
        type="button"
        role="button"
        tabIndex={0}
        aria-label={`Save ${title}`}
        aria-pressed={isLiked}
        onClick={triggerLike}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            triggerLike(event)
          }
        }}
        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/90 transition-transform duration-150 hover:scale-105"
      >
        <Heart
          className={`h-4 w-4 transition-colors duration-150 ${
            isLiked ? 'fill-red-500 text-red-500 animate-wishlist-pop-in' : 'text-neutral-700 animate-wishlist-pop-out'
          }`}
        />
      </button>
    </article>
  )
}

const areEqual = (previousProps: ProductCardProps, nextProps: ProductCardProps) =>
  previousProps.id === nextProps.id &&
  previousProps.isLiked === nextProps.isLiked &&
  previousProps.isSold === nextProps.isSold

export default memo(ProductCardComponent, areEqual)
