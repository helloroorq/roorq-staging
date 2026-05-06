'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatINR } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type AdminOrderRow = {
  id: string
  order_number: string | null
  total_amount: number
  payment_method: string
  payment_status: string
  created_at: string
  user?: { email: string | null } | null
  vendor_orders?: { status: string }[] | null
}

type AdminOrdersClientProps = {
  initialOrders: AdminOrderRow[]
  statusFilter: string | null
}

type RawOrderRow = AdminOrderRow & { user?: { email: string | null }[] | { email: string | null } | null }

const matchesFilter = (status: string, filter: string | null) => {
  if (!filter) return true
  return status === filter
}

const orderSort = (a: AdminOrderRow, b: AdminOrderRow) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

const summarizeVendorStatus = (statuses: string[]) => {
  if (statuses.length === 0) return 'pending'
  if (statuses.every((status) => status === 'delivered')) return 'delivered'
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled'
  if (statuses.some((status) => status === 'out_for_delivery' || status === 'shipped')) {
    return 'out_for_delivery'
  }
  if (statuses.some((status) => status === 'processing' || status === 'ready_to_ship' || status === 'confirmed')) {
    return 'processing'
  }
  return 'pending'
}

const normalizeOrderRow = (order: RawOrderRow): AdminOrderRow => {
  const user = Array.isArray(order.user) ? order.user[0] : order.user
  return {
    ...order,
    user: user ?? null,
  }
}

export default function AdminOrdersClient({
  initialOrders,
  statusFilter,
}: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<AdminOrderRow[]>(
    (initialOrders ?? []).map((order) => normalizeOrderRow(order as RawOrderRow))
  )
  const [isLive, setIsLive] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setOrders((initialOrders ?? []).map((order) => normalizeOrderRow(order as RawOrderRow)))
  }, [initialOrders])

  const refreshOrders = useCallback(async () => {
    setRefreshing(true)
    try {
      let query = supabase
        .from('parent_orders')
        .select('id, order_number, total_amount, payment_method, payment_status, created_at, user:users(email), vendor_orders(status)')
        .order('created_at', { ascending: false })
      if (statusFilter) {
        query = query.eq('payment_status', statusFilter)
      }
      const { data, error } = await query
      if (error) {
        logger.error('Failed to refresh orders', { error: error.message })
        return
      }
      const normalized = (data ?? []).map((order) => normalizeOrderRow(order as RawOrderRow))
      setOrders(normalized)
    } finally {
      setRefreshing(false)
    }
  }, [statusFilter, supabase])

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parent_orders' },
        (payload: RealtimePostgresChangesPayload<AdminOrderRow>) => {
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old
            if (!deleted?.id) return
            setOrders((current) => current.filter((item) => item.id !== deleted.id))
            return
          }

          const record = payload.new as RawOrderRow
          if (!record?.id) return

          setOrders((current) => {
            const filtered = current.filter((item) => item.id !== record.id)
            const normalized = normalizeOrderRow(record)
            if (!matchesFilter(normalized.payment_status, statusFilter)) {
              return filtered.sort(orderSort)
            }
            return [normalized, ...filtered].sort(orderSort)
          })
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [statusFilter, supabase])

  const statuses = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Orders</h1>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`px-2 py-1 rounded-full uppercase tracking-wide ${
              isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isLive ? 'Live' : 'Paused'}
          </span>
          <button
            type="button"
            onClick={refreshOrders}
            className="px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:text-black"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((status) => (
          <Link
            key={status.value}
            href={`/admin/orders${status.value ? `?status=${status.value}` : ''}`}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === status.value || (!statusFilter && status.value === '')
                ? 'bg-black text-white'
                : 'bg-white text-black border border-gray-300 hover:border-black'
            }`}
          >
            {status.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders && orders.length > 0 ? (
                orders.map((order) => {
                  const vendorStatuses = (order.vendor_orders ?? []).map((vo) => vo.status)
                  const summaryStatus = summarizeVendorStatus(vendorStatuses)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.user?.email ?? order.id.slice(0, 6)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{vendorStatuses.length} vendors</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatINR(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'failed'
                              ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.payment_method.toUpperCase()}
                          {order.payment_status === 'paid' && ' (paid)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            summaryStatus === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : summaryStatus === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : summaryStatus === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {summaryStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

