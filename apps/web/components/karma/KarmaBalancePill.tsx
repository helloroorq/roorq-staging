'use client'

import Link from 'next/link'

export default function KarmaBalancePill({ balance }: { balance: number | null }) {
  if (balance === null) {
    return null
  }

  return (
    <Link
      href="/karma"
      className="hidden rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-white md:inline-flex"
    >
      Karma {balance}
    </Link>
  )
}
