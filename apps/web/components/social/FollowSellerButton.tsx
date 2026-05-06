'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'

const FOLLOWED_SELLERS_STORAGE_KEY = 'roorq_followed_sellers'

const readFollowedSellers = () => {
  if (typeof window === 'undefined') {
    return [] as string[]
  }

  try {
    const rawValue = window.localStorage.getItem(FOLLOWED_SELLERS_STORAGE_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

type FollowSellerButtonProps = {
  sellerId: string
  sellerName: string
}

export default function FollowSellerButton({ sellerId, sellerName }: FollowSellerButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followCountDelta, setFollowCountDelta] = useState(0)

  useEffect(() => {
    setIsFollowing(readFollowedSellers().includes(sellerId))
  }, [sellerId])

  const label = useMemo(() => (isFollowing ? `Following ${sellerName}` : `Follow ${sellerName}`), [isFollowing, sellerName])

  const toggleFollow = () => {
    const existing = readFollowedSellers()
    const isCurrentlyFollowing = existing.includes(sellerId)
    const updated = isCurrentlyFollowing ? existing.filter((id) => id !== sellerId) : [...existing, sellerId]

    window.localStorage.setItem(FOLLOWED_SELLERS_STORAGE_KEY, JSON.stringify(updated))
    setIsFollowing(!isCurrentlyFollowing)
    setFollowCountDelta((current) => current + (isCurrentlyFollowing ? -1 : 1))
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleFollow}
        className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
          isFollowing
            ? 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400'
            : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {label}
      </button>
      {followCountDelta !== 0 ? (
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {followCountDelta > 0 ? 'Added to your follows' : 'Removed from follows'}
        </span>
      ) : null}
    </div>
  )
}
