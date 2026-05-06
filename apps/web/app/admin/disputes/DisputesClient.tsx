'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'
import { formatINR } from '@/lib/utils/currency'

type AdminUserInfo = {
  id: string
  full_name: string | null
  email: string | null
  store_name?: string | null
  business_name?: string | null
}

type ParentOrderInfo = {
  id: string
  order_number: string | null
  total_amount: number
  payment_status: string
}

type VendorOrderInfo = {
  id: string
  status: string
}

export type AdminDisputeRow = {
  id: string
  status: string
  priority: string
  reason: string
  summary: string | null
  resolution_note: string | null
  refund_amount: number | null
  created_at: string
  last_action_at: string
  parent_order_id: string | null
  vendor_order_id: string | null
  customer: AdminUserInfo | null
  vendor: AdminUserInfo | null
  assignee: AdminUserInfo | null
  parent_order: ParentOrderInfo | null
  vendor_order: VendorOrderInfo | null
}

type DisputesClientProps = {
  initialDisputes: AdminDisputeRow[]
  currentAdminId: string | null
}

type DraftState = {
  status: string
  priority: string
  resolutionNote: string
  refundAmount: string
}

const STATUS_OPTIONS = [
  'open',
  'investigating',
  'waiting_customer',
  'waiting_vendor',
  'resolved',
  'rejected',
] as const

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const

const getLabel = (value: string) => value.replace(/_/g, ' ')

const personLabel = (person: AdminUserInfo | null) => {
  if (!person) return '-'
  return person.store_name || person.business_name || person.full_name || person.email || 'Unknown'
}

export default function DisputesClient({ initialDisputes, currentAdminId }: DisputesClientProps) {
  const [disputes, setDisputes] = useState(initialDisputes)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [drafts, setDrafts] = useState<Record<string, DraftState>>(() =>
    Object.fromEntries(
      initialDisputes.map((item) => [
        item.id,
        {
          status: item.status,
          priority: item.priority,
          resolutionNote: item.resolution_note ?? '',
          refundAmount: item.refund_amount ? String(item.refund_amount) : '',
        },
      ])
    )
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [csrf] = useState(getOrCreateCsrfToken())

  const filtered = useMemo(() => {
    return disputes.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      return true
    })
  }, [disputes, priorityFilter, statusFilter])

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }))
  }

  const saveDispute = async (id: string) => {
    if (!csrf) {
      toast.error('Security token missing. Please refresh.')
      return
    }

    const draft = drafts[id]
    if (!draft) return

    setSavingId(id)
    try {
      const refundAmount =
        draft.refundAmount.trim().length > 0 ? Number.parseFloat(draft.refundAmount.trim()) : undefined
      if (refundAmount !== undefined && Number.isNaN(refundAmount)) {
        throw new Error('Refund amount must be a valid number')
      }

      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: draft.status,
          priority: draft.priority,
          resolutionNote: draft.resolutionNote.trim() || undefined,
          refundAmount,
          csrf,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update dispute')
      }

      setDisputes((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: draft.status,
                priority: draft.priority,
                resolution_note: draft.resolutionNote.trim() || null,
                refund_amount: refundAmount ?? null,
                last_action_at: new Date().toISOString(),
              }
            : item
        )
      )
      toast.success('Dispute updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update dispute')
    } finally {
      setSavingId(null)
    }
  }

  const assignToMe = async (id: string) => {
    if (!csrf || !currentAdminId) {
      toast.error('Cannot assign right now.')
      return
    }

    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: currentAdminId,
          status: 'investigating',
          csrf,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign dispute')
      }
      setDisputes((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'investigating',
                assignee: { id: currentAdminId, full_name: 'You', email: null },
              }
            : item
        )
      )
      updateDraft(id, { status: 'investigating' })
      toast.success('Assigned to you')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign dispute')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Disputes</h1>
        <p className="text-sm text-gray-600 mt-1">
          Handle escalations, track owner, and close with a clear outcome.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {getLabel(status)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All Priorities</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {getLabel(priority)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((dispute) => {
          const draft = drafts[dispute.id]
          const loading = savingId === dispute.id
          return (
            <div key={dispute.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-500">{dispute.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold mt-1">{dispute.summary || dispute.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Opened {new Date(dispute.created_at).toLocaleString()} | Last action{' '}
                    {new Date(dispute.last_action_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Customer: {personLabel(dispute.customer)}</p>
                  <p>Vendor: {personLabel(dispute.vendor)}</p>
                  <p>Owner: {personLabel(dispute.assignee)}</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 flex flex-wrap gap-4 mb-3">
                {dispute.parent_order ? (
                  <Link href={`/admin/orders/${dispute.parent_order.id}`} className="text-blue-600 hover:underline">
                    Order #{dispute.parent_order.order_number ?? dispute.parent_order.id.slice(0, 8).toUpperCase()} (
                    {formatINR(dispute.parent_order.total_amount)})
                  </Link>
                ) : (
                  <span>Order: -</span>
                )}
                <span>Vendor order status: {dispute.vendor_order?.status ?? '-'}</span>
                <span className="uppercase">Reason: {getLabel(dispute.reason)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={draft?.status ?? dispute.status}
                  onChange={(event) => updateDraft(dispute.id, { status: event.target.value })}
                  className="border border-gray-300 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getLabel(status)}
                    </option>
                  ))}
                </select>
                <select
                  value={draft?.priority ?? dispute.priority}
                  onChange={(event) => updateDraft(dispute.id, { priority: event.target.value })}
                  className="border border-gray-300 px-3 py-2 text-sm"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {getLabel(priority)}
                    </option>
                  ))}
                </select>
                <input
                  value={draft?.refundAmount ?? ''}
                  onChange={(event) => updateDraft(dispute.id, { refundAmount: event.target.value })}
                  className="border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Refund amount (optional)"
                />
                <button
                  type="button"
                  onClick={() => assignToMe(dispute.id)}
                  disabled={loading || !currentAdminId}
                  className="border border-gray-300 px-3 py-2 text-sm font-semibold"
                >
                  {loading ? 'Working...' : 'Assign to me'}
                </button>
              </div>

              <textarea
                value={draft?.resolutionNote ?? ''}
                onChange={(event) => updateDraft(dispute.id, { resolutionNote: event.target.value })}
                className="mt-3 w-full border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Resolution note for the team timeline"
              />

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => saveDispute(dispute.id)}
                  disabled={loading}
                  className="bg-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Dispute Update'}
                </button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No disputes for the selected filters.
          </div>
        )}
      </div>
    </div>
  )
}
