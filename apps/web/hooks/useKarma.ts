'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { KarmaSnapshot } from '@/lib/karma/types'
import { getKarmaApiBaseUrl } from '@/lib/karma/api-base'

export const useKarma = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<KarmaSnapshot | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setSnapshot(null)
        setError('Not signed in')
        return
      }
      const base = getKarmaApiBaseUrl()
      if (!base) {
        setError('Karma service URL not configured (NEXT_PUBLIC_KARMA_API_URL).')
        setSnapshot(null)
        return
      }
      const response = await fetch(`${base}/api/users/me/karma`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = (await response.json()) as {
        error?: string
        balance?: number
        recentTransactions?: KarmaSnapshot['recentTransactions']
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load karma')
      }
      setSnapshot({
        balance: data.balance ?? 0,
        recentTransactions: data.recentTransactions ?? [],
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load karma')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, error, snapshot, refresh }
}
