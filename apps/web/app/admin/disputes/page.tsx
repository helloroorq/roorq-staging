import { createClient } from '@/lib/supabase/server'
import DisputesClient, { type AdminDisputeRow } from './DisputesClient'

type UserLookup = {
  id: string
  full_name: string | null
  email: string | null
  store_name?: string | null
  business_name?: string | null
}

type ParentOrderLookup = {
  id: string
  order_number: string | null
  total_amount: number
  payment_status: string
}

type VendorOrderLookup = {
  id: string
  status: string
}

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: disputes } = await supabase
    .from('disputes')
    .select(
      'id, parent_order_id, vendor_order_id, customer_id, vendor_id, assigned_to, status, priority, reason, summary, resolution_note, refund_amount, created_at, last_action_at'
    )
    .order('created_at', { ascending: false })

  const disputeRows = disputes ?? []

  const userIds = Array.from(
    new Set(
      disputeRows
        .flatMap((row) => [row.customer_id, row.vendor_id, row.assigned_to])
        .filter((value): value is string => Boolean(value))
    )
  )

  const parentOrderIds = Array.from(
    new Set(disputeRows.map((row) => row.parent_order_id).filter((value): value is string => Boolean(value)))
  )

  const vendorOrderIds = Array.from(
    new Set(disputeRows.map((row) => row.vendor_order_id).filter((value): value is string => Boolean(value)))
  )

  const [usersResult, parentOrdersResult, vendorOrdersResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from('users')
          .select('id, full_name, email, store_name, business_name')
          .in('id', userIds)
      : Promise.resolve({ data: [] as UserLookup[] }),
    parentOrderIds.length > 0
      ? supabase
          .from('parent_orders')
          .select('id, order_number, total_amount, payment_status')
          .in('id', parentOrderIds)
      : Promise.resolve({ data: [] as ParentOrderLookup[] }),
    vendorOrderIds.length > 0
      ? supabase.from('vendor_orders').select('id, status').in('id', vendorOrderIds)
      : Promise.resolve({ data: [] as VendorOrderLookup[] }),
  ])

  const usersById = new Map((usersResult.data ?? []).map((item) => [item.id, item]))
  const parentOrdersById = new Map((parentOrdersResult.data ?? []).map((item) => [item.id, item]))
  const vendorOrdersById = new Map((vendorOrdersResult.data ?? []).map((item) => [item.id, item]))

  const initialDisputes: AdminDisputeRow[] = disputeRows.map((row) => ({
    id: row.id,
    status: row.status,
    priority: row.priority,
    reason: row.reason,
    summary: row.summary,
    resolution_note: row.resolution_note,
    refund_amount: row.refund_amount,
    created_at: row.created_at,
    last_action_at: row.last_action_at,
    parent_order_id: row.parent_order_id,
    vendor_order_id: row.vendor_order_id,
    customer: row.customer_id ? usersById.get(row.customer_id) ?? null : null,
    vendor: row.vendor_id ? usersById.get(row.vendor_id) ?? null : null,
    assignee: row.assigned_to ? usersById.get(row.assigned_to) ?? null : null,
    parent_order: row.parent_order_id ? parentOrdersById.get(row.parent_order_id) ?? null : null,
    vendor_order: row.vendor_order_id ? vendorOrdersById.get(row.vendor_order_id) ?? null : null,
  }))

  return (
    <DisputesClient
      initialDisputes={initialDisputes}
      currentAdminId={user?.id ?? null}
    />
  )
}
