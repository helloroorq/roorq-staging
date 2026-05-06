'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

export default function ProductApprovalActions({
  productId,
  approvalStatus,
}: {
  productId: string
  approvalStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const [csrf] = useState(getOrCreateCsrfToken())

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status, csrf }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update product')
      toast.success('Product updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus('approved')}
        className="text-green-700 text-xs font-bold uppercase"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus('rejected')}
        className="text-red-600 text-xs font-bold uppercase"
      >
        Reject
      </button>
    </div>
  )
}
