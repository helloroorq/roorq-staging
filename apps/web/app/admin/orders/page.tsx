import { createClient } from '@/lib/supabase/server'
import AdminOrdersClient, { type AdminOrderRow } from './AdminOrdersClient'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('parent_orders')
    .select('id, order_number, total_amount, payment_method, payment_status, created_at, user:users(email), vendor_orders(status)')
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('payment_status', searchParams.status)
  }

  const { data: orders } = await query
  const normalized = (orders ?? []).map((order) => ({
    ...order,
    user: Array.isArray(order.user) ? order.user[0] : order.user,
  })) as AdminOrderRow[]

  return (
    <AdminOrdersClient
      initialOrders={normalized}
      statusFilter={searchParams.status ?? null}
    />
  )
}

