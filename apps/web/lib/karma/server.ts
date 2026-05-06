import type { SupabaseClient } from '@supabase/supabase-js'
import type { KarmaSnapshot, KarmaTransactionRow } from '@/lib/karma/types'

type UserKarmaRow = {
  karma_balance: number | null
}

/**
 * Read-only karma state via Supabase (RLS). Matches GET /api/users/me/karma shape.
 */
export const fetchKarmaSnapshot = async (supabase: SupabaseClient, userId: string): Promise<KarmaSnapshot> => {
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('karma_balance')
    .eq('id', userId)
    .single<UserKarmaRow>()

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'Unable to load karma profile')
  }

  const { data: ledgerRows, error: ledgerError } = await supabase
    .from('karma_ledger')
    .select('id, delta, reason, reference_id, created_at, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (ledgerError) {
    throw new Error(ledgerError.message)
  }

  const balance = Number(profile.karma_balance ?? 0)

  return {
    balance,
    recentTransactions: ((ledgerRows ?? []) as KarmaTransactionRow[]).map((row) => ({
      ...row,
      delta: Number(row.delta ?? 0),
    })),
  }
}
