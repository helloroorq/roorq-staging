export const WISHLIST_STORAGE_KEY = 'roorq_wishlist'
export const WISHLIST_UPDATED_EVENT = 'wishlistUpdated'

const normalizeWishlistIds = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)))
}

export const readWishlistIds = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
    return normalizeWishlistIds(storedValue ? JSON.parse(storedValue) : [])
  } catch {
    return []
  }
}

export const readWishlistCount = () => readWishlistIds().length

export const writeWishlistIds = (ids: string[]) => {
  const nextIds = normalizeWishlistIds(ids)

  if (typeof window === 'undefined') {
    return nextIds
  }

  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextIds))
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT))
  return nextIds
}

export const toggleWishlistId = (id: string, current: boolean) => {
  const existingIds = readWishlistIds()
  return writeWishlistIds(current ? existingIds.filter((entry) => entry !== id) : [...existingIds, id])
}
