export type KarmaTransactionRow = {
  id: string
  delta: number
  reason: string
  reference_id: string | null
  created_at: string
  expires_at: string | null
}

export type KarmaSnapshot = {
  balance: number
  recentTransactions: KarmaTransactionRow[]
}
