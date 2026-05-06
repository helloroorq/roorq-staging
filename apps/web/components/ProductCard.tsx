'use client'

import { useEffect, useState } from 'react'
import ProductCardTile from '@/components/product/ProductCard'
import { buildProductSocialProof } from '@/lib/social/proof'
import { readWishlistIds, toggleWishlistId, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

type SellerSummary = {
  id: string
  store_name?: string | null
  business_name?: string | null
  store_logo_url?: string | null
} | null

export type LegacyProduct = {
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
  condition?: string | null
  reserved_quantity?: number | null
  stock_quantity?: number | null
  is_sold?: boolean | null
  vendor_id?: string | null
  seller?: SellerSummary
  vendor?: SellerSummary
}

const mapCondition = (condition: string | null | undefined): 'like_new' | 'good' | 'fair' | 'well_loved' => {
  switch ((condition ?? '').toLowerCase()) {
    case 'like_new':
    case 'new':
      return 'like_new'
    case 'fair':
      return 'fair'
    case 'poor':
    case 'well_loved':
      return 'well_loved'
    case 'good':
    default:
      return 'good'
  }
}

const resolveSoldState = (product: LegacyProduct) => {
  if (typeof product.is_sold === 'boolean') {
    return product.is_sold
  }

  const stockQuantity = Math.max(0, Number(product.stock_quantity ?? 0))
  const reservedQuantity = Math.max(0, Number(product.reserved_quantity ?? 0))
  return stockQuantity - reservedQuantity <= 0
}

export default function ProductCard({ product }: { product: LegacyProduct }) {
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const syncWishlistState = () => {
      setIsLiked(readWishlistIds().includes(product.id))
    }

    syncWishlistState()
    window.addEventListener('storage', syncWishlistState)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState as EventListener)

    return () => {
      window.removeEventListener('storage', syncWishlistState)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState as EventListener)
    }
  }, [product.id])

  const condition = mapCondition(product.condition)
  const seller = product.seller ?? product.vendor ?? null
  const availableStock = Math.max(0, Number(product.stock_quantity ?? 0) - Number(product.reserved_quantity ?? 0))
  const socialProof = buildProductSocialProof(product.id, product.vendor_id ?? seller?.id ?? 'roorq')

  return (
    <ProductCardTile
      id={product.id}
      slug={product.slug || product.id}
      title={product.title || product.name}
      brand={product.brand || 'Vintage'}
      category={product.category || 'fashion'}
      price={Number(product.price ?? 0)}
      size={product.size || 'Free'}
      condition={condition}
      imageUrl={product.image_url || product.images?.[0] || '/roorq-final7.png'}
      isSold={resolveSoldState(product)}
      inventoryLeft={availableStock}
      isLiked={isLiked}
      seller={{
        id: seller?.id || product.vendor_id || product.id,
        username: seller?.store_name || seller?.business_name || 'Roorq seller',
        avatarUrl: seller?.store_logo_url || null,
      }}
      socialProof={{
        averageRating: socialProof.averageRating,
        reviewCount: socialProof.reviewCount,
        saveCount: socialProof.saveCount,
      }}
      onLike={(id, current) => {
        toggleWishlistId(id, current)
        setIsLiked(!current)
      }}
    />
  )
}
