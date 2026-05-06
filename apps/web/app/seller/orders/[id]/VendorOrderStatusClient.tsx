'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'processing',
  'ready_to_ship',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const

type VendorOrderStatusClientProps = {
  orderId: string
  initialStatus: string
  initialTrackingNumber?: string | null
  initialTrackingUrl?: string | null
}

export default function VendorOrderStatusClient({
  orderId,
  initialStatus,
  initialTrackingNumber,
  initialTrackingUrl,
}: VendorOrderStatusClientProps) {
  const [csrfToken, setCsrfToken] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? '')
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!csrfToken) {
      const token = getOrCreateCsrfToken()
      setCsrfToken(token)
      if (!token) {
        toast.error('Security token missing. Please refresh.')
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || null,
          trackingUrl: trackingUrl || null,
          csrf: csrfToken || getOrCreateCsrfToken(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order')
      }
      toast.success('Order updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Tracking #</label>
          <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-full border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Tracking URL</label>
          <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className="w-full border px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="mt-3">
        <button onClick={handleSave} disabled={saving} className="bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Updates'}
        </button>
      </div>
    </div>
  )
}
