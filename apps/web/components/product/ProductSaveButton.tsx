'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { readWishlistIds, toggleWishlistId, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

type ProductSaveButtonProps = {
  productId: string
  productName: string
}

export default function ProductSaveButton({ productId, productName }: ProductSaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(readWishlistIds().includes(productId))
    }

    syncSavedState()
    window.addEventListener('storage', syncSavedState)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncSavedState as EventListener)
    return () => {
      window.removeEventListener('storage', syncSavedState)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncSavedState as EventListener)
    }
  }, [productId])

  return (
    <button
      type="button"
      onClick={() => {
        toggleWishlistId(productId, isSaved)
        setIsSaved((currentState) => !currentState)
      }}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 border text-sm font-semibold transition ${
        isSaved ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-gray-200 bg-white text-slate-900 hover:border-gray-300 hover:bg-gray-50'
      }`}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${productName} from saved` : `Save ${productName}`}
    >
      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
      {isSaved ? 'Saved' : 'Save for later'}
    </button>
  )
}
