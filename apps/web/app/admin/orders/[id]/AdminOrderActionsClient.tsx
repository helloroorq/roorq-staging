'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_VALUES,
  OrderStatus,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from '@/lib/orders/status'

export type AdminOrderSummary = {
  id: string
  status: string
  payment_status: string
  payment_method: string
  rider_id: string | null
  order_number: string
  total_amount: number
  delivery_hostel: string | null
  delivery_room: string | null
}

type Rider = {
  id: string
  name: string
  phone: string
  is_active: boolean
}

type AdminOrderActionsClientProps = {
  order: AdminOrderSummary
  riders: Rider[]
}

const buildStatusOptions = (currentStatus: OrderStatus) => {
  const allowed = new Set([currentStatus, ...ORDER_STATUS_FLOW[currentStatus]])
  return ORDER_STATUS_VALUES.filter((status) => allowed.has(status))
}

export default function AdminOrderActionsClient({
  order,
  riders,
}: AdminOrderActionsClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [currentOrder, setCurrentOrder] = useState(order)
  const [status, setStatus] = useState<OrderStatus>(normalizeOrderStatus(order.status))
  const [riderId, setRiderId] = useState<string | null>(order.rider_id)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [cancelReason, setCancelReason] = useState('rto')
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    setCurrentOrder(order)
    setStatus(normalizeOrderStatus(order.status))
    setRiderId(order.rider_id)
  }, [order])

  useEffect(() => {
    setCsrfToken(getOrCreateCsrfToken())
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`admin-order-${order.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload: RealtimePostgresChangesPayload<AdminOrderSummary>) => {
          const updated = payload.new as Partial<AdminOrderSummary> | null
          if (updated && typeof updated.id === 'string') {
            const fullOrder = updated as AdminOrderSummary
            setCurrentOrder(fullOrder)
            setStatus(normalizeOrderStatus(fullOrder.status))
            setRiderId(fullOrder.rider_id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order.id, supabase])

  const updateOrder = useCallback(async () => {
    if (!csrfToken) {
      toast.error('Security token missing. Please refresh.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, riderId, csrf: csrfToken }),
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
  }, [csrfToken, order.id, riderId, status])

  const collectPayment = useCallback(async () => {
    if (!csrfToken) {
      toast.error('Security token missing. Please refresh.')
      return
    }
    setCollecting(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'collect_payment', riderId, csrf: csrfToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to collect payment')
      }
      toast.success('Payment marked as collected')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to collect payment')
    } finally {
      setCollecting(false)
    }
  }, [csrfToken, order.id, riderId])

  const cancelOrder = useCallback(async () => {
    if (!csrfToken) {
      toast.error('Security token missing. Please refresh.')
      return
    }
    setCancelling(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', cancellationReason: cancelReason, csrf: csrfToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }
      toast.success('Order cancelled')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }, [cancelReason, csrfToken, order.id])

  const statusOptions = buildStatusOptions(status)
  const paymentCollected = currentOrder.payment_status === 'collected'
  const paymentReady = status === 'delivered' && !paymentCollected
  const cancelDisabled = status === 'payment_collected' || paymentCollected

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Fulfillment Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {getOrderStatusLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            Assign Rider
          </label>
          <select
            value={riderId ?? ''}
            onChange={(event) => setRiderId(event.target.value || null)}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="">Unassigned</option>
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id} disabled={!rider.is_active}>
                {rider.name} ({rider.phone}){rider.is_active ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          onClick={updateOrder}
          disabled={saving}
          className="bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Updates'}
        </button>

        <button
          type="button"
          onClick={collectPayment}
          disabled={!paymentReady || collecting}
          className="border border-green-600 text-green-700 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {paymentCollected ? 'Payment Collected' : collecting ? 'Collecting...' : 'Mark Payment Collected'}
        </button>
      </div>

      <div className="mt-6 border-t pt-4">
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
          RTO / Cancellation Reason
        </label>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
          >
            <option value="rto">RTO (Customer not available)</option>
            <option value="customer_cancelled">Customer cancelled</option>
            <option value="admin_cancelled">Admin cancelled</option>
          </select>
          <button
            type="button"
            onClick={cancelOrder}
            disabled={cancelling || cancelDisabled}
            className="border border-red-600 text-red-700 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel / Mark RTO'}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Current: {getOrderStatusLabel(currentOrder.status)} - Payment: {currentOrder.payment_status}
      </p>
    </div>
  )
}

