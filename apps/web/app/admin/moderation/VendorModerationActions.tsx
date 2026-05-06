'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

type VendorModerationActionsProps = {
  vendorId: string
}

export default function VendorModerationActions({ vendorId }: VendorModerationActionsProps) {
  const [loading, setLoading] = useState(false)
  const [csrf] = useState(getOrCreateCsrfToken())

  const updateVendor = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, csrf }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update vendor')
      }
      toast.success('Vendor updated')
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
        onClick={() => updateVendor('approved')}
        className="text-green-700 text-xs font-bold uppercase"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateVendor('documents_pending')}
        className="text-yellow-700 text-xs font-bold uppercase"
      >
        Ask Docs
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateVendor('rejected')}
        className="text-red-600 text-xs font-bold uppercase"
      >
        Reject
      </button>
    </div>
  )
}
