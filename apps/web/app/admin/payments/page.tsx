import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatINR } from '@/lib/utils/currency'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

const STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded']

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()
  const activeStatus = STATUSES.includes(searchParams.status as PaymentStatus)
    ? (searchParams.status as PaymentStatus)
    : null

  const [pendingCount, failedCount, refundedCount] = await Promise.all([
    supabase
      .from('parent_orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
    supabase
      .from('parent_orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'failed'),
    supabase
      .from('parent_orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'refunded'),
  ])

  let query = supabase
    .from('parent_orders')
    .select('id, order_number, total_amount, payment_method, payment_status, created_at, user:users(email)')
    .order('created_at', { ascending: false })
    .limit(80)

  if (activeStatus) {
    query = query.eq('payment_status', activeStatus)
  }

  const { data } = await query
  const rows =
    data?.map((item) => ({
      ...item,
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    })) ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Payments</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitor payment exceptions and quickly jump to order actions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
          <p className="text-2xl font-bold mt-1">{pendingCount.count ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Failed</p>
          <p className="text-2xl font-bold mt-1">{failedCount.count ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Refunded</p>
          <p className="text-2xl font-bold mt-1">{refundedCount.count ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/payments"
          className={`px-4 py-2 rounded text-sm font-medium ${
            !activeStatus ? 'bg-black text-white' : 'border border-gray-300 bg-white text-black'
          }`}
        >
          All
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/payments?status=${status}`}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeStatus === status ? 'bg-black text-white' : 'border border-gray-300 bg-white text-black'
            }`}
          >
            {status}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 font-mono text-sm">
                      {row.order_number ?? row.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm">{row.user?.email ?? '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{formatINR(row.total_amount)}</td>
                    <td className="px-6 py-4 text-sm uppercase">{row.payment_method}</td>
                    <td className="px-6 py-4 text-sm uppercase">{row.payment_status}</td>
                    <td className="px-6 py-4 text-sm">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${row.id}`} className="text-blue-600 hover:underline text-sm">
                        Open order
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payments found.
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
