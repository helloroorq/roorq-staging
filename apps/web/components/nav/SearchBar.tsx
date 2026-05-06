'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock3, Search, X } from 'lucide-react'

const RECENT_SEARCHES_KEY = 'roorq_recent_searches'
const MAX_RECENT_SEARCHES = 5

const readRecentSearches = () => {
  if (typeof window === 'undefined') {
    return [] as string[]
  }

  try {
    const storedValue = window.localStorage.getItem(RECENT_SEARCHES_KEY)
    const parsedValue = storedValue ? JSON.parse(storedValue) : []
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : []
  } catch {
    return []
  }
}

const persistRecentSearches = (value: string) => {
  if (typeof window === 'undefined') {
    return [] as string[]
  }

  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return readRecentSearches()
  }

  const nextValues = [
    normalizedValue,
    ...readRecentSearches().filter((entry) => entry.toLowerCase() !== normalizedValue.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES)

  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextValues))
  return nextValues
}

const PLACEHOLDER_DEFAULT = 'Search for "white linen trousers"'

type SearchBarProps = {
  className?: string
  /** `mobile` matches compact header row: lighter chrome, slightly stronger border. */
  variant?: 'desktop' | 'mobile'
}

export default function SearchBar({ className = '', variant = 'desktop' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<number | null>(null)
  const [query, setQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const nextQuery = searchParams?.get('q') ?? searchParams?.get('search') ?? ''
    setQuery(nextQuery)
  }, [searchParams])

  useEffect(() => {
    setRecentSearches(readRecentSearches())
  }, [])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current)
      }
    }
  }, [])

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  const pushSearch = (value: string) => {
    const normalizedValue = value.trim()
    const params = new URLSearchParams()

    if (normalizedValue) {
      params.set('q', normalizedValue)
      setRecentSearches(persistRecentSearches(normalizedValue))
      setQuery(normalizedValue)
    } else {
      setQuery('')
    }

    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
    closeDropdown()
  }

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          pushSearch(query)
        }}
        className={`flex h-12 items-center rounded-full bg-white pl-4 pr-3 transition-colors duration-200 ${
          variant === 'mobile'
            ? 'border border-neutral-700 focus-within:border-neutral-900'
            : 'border border-neutral-200 focus-within:border-neutral-400'
        }`}
        role="search"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center text-neutral-500">
          <Search className="h-4 w-4" />
        </span>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              window.clearTimeout(blurTimeoutRef.current)
            }
            setRecentSearches(readRecentSearches())
            setIsDropdownOpen(true)
          }}
          onBlur={() => {
            blurTimeoutRef.current = window.setTimeout(closeDropdown, 120)
          }}
          placeholder={PLACEHOLDER_DEFAULT}
          aria-label="Search products"
          className="ml-1 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-500"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setRecentSearches(readRecentSearches())
              window.requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      {isDropdownOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            <Clock3 className="h-3.5 w-3.5" />
            Recent searches
          </div>

          {recentSearches.length > 0 ? (
            <div className="space-y-1">
              {recentSearches.map((recentSearch) => (
                <button
                  key={recentSearch}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pushSearch(recentSearch)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
                >
                  <span className="truncate">{recentSearch}</span>
                  <Search className="h-3.5 w-3.5 text-neutral-400" />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-neutral-500">No recent searches yet.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
