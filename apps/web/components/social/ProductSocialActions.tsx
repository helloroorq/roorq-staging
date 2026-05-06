'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Heart } from 'lucide-react'
import { readWishlistIds, toggleWishlistId, WISHLIST_UPDATED_EVENT } from '@/lib/wishlist'

type ProductSocialActionsProps = {
  productId: string
  baseSaveCount: number
}

export default function ProductSocialActions({ productId, baseSaveCount }: ProductSocialActionsProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const syncSavedState = () => {
      setSaved(readWishlistIds().includes(productId))
    }

    syncSavedState()
    window.addEventListener('storage', syncSavedState)
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncSavedState as EventListener)

    return () => {
      window.removeEventListener('storage', syncSavedState)
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncSavedState as EventListener)
    }
  }, [productId])

  const saveCount = useMemo(() => baseSaveCount + (saved ? 1 : 0), [baseSaveCount, saved])

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Community actions</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            toggleWishlistId(productId, saved)
            setSaved(!saved)
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            saved
              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300'
              : 'border-stone-300 bg-white text-slate-700 hover:border-stone-400'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          <Bookmark className="h-3.5 w-3.5" />
          {saveCount} saves
        </span>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Save signals show buyer interest and help prioritize fast-moving listings.
      </p>
    </div>
  )
}
