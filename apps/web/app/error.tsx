'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          We hit an unexpected issue. Try again, or go back to the homepage.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-gray-300 px-6 py-3 rounded font-semibold hover:border-black transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
