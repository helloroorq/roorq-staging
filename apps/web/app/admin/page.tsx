import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatINR } from '@/lib/utils/currency'
const summarizeVendorStatus = (statuses: string[]) => {
  if (statuses.length === 0) return 'pending'
  if (statuses.every((status) => status === 'delivered')) return 'delivered'
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled'
  if (statuses.some((status) => status === 'out_for_delivery' || status === 'shipped')) return 'out_for_delivery'
  if (statuses.some((status) => status === 'processing' || status === 'ready_to_ship' || status === 'confirmed')) return 'processing'
  return 'pending'
}

export default async function AdminPage() {
  const supabase = await createClient()

  const pendingStatuses = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'out_for_delivery']

  // Get stats
  const { count: orderCount } = await supabase
    .from('vendor_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', pendingStatuses)

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'approved')

  const { count: disputeCount } = await supabase
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'investigating', 'waiting_customer', 'waiting_vendor'])

  const { data: recentOrders } = await supabase
    .from('parent_orders')
    .select('id, order_number, total_amount, payment_status, payment_method, created_at, user:users(email), vendor_orders(status)')
    .order('created_at', { ascending: false })
    .limit(5)

  const normalizedOrders =
    recentOrders?.map((order) => ({
      ...order,
      user: Array.isArray(order.user) ? order.user[0] : order.user,
    })) ?? []

  // Calculate today's revenue
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayOrders } = await supabase
    .from('parent_orders')
    .select('total_amount')
    .gte('created_at', today.toISOString())
    .eq('payment_status', 'paid')

  const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-600 mb-2 text-sm uppercase tracking-wider">Pending Orders</h3>
          <p className="text-3xl font-bold">{orderCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-600 mb-2 text-sm uppercase tracking-wider">Active Products</h3>
          <p className="text-3xl font-bold">{productCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-600 mb-2 text-sm uppercase tracking-wider">Today's Revenue</h3>
          <p className="text-3xl font-bold">{formatINR(todayRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-600 mb-2 text-sm uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/products/new" className="text-blue-600 hover:underline block text-sm">
              + Add Product
            </Link>
            <Link href="/admin/drops/new" className="text-blue-600 hover:underline block text-sm">
              + Create Drop
            </Link>
            <Link href="/admin/disputes" className="text-blue-600 hover:underline block text-sm">
              + Review disputes ({disputeCount || 0})
            </Link>
            <Link href="/admin/moderation" className="text-blue-600 hover:underline block text-sm">
              + Clear moderation queue
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {normalizedOrders.length > 0 ? (
                normalizedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order.order_number ?? order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.user?.email ?? order.id.slice(0, 6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{formatINR(order.total_amount)}</td>
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
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          summarizeVendorStatus((order.vendor_orders ?? []).map((vo: { status: string }) => vo.status)) === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : summarizeVendorStatus((order.vendor_orders ?? []).map((vo: { status: string }) => vo.status)) === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : summarizeVendorStatus((order.vendor_orders ?? []).map((vo: { status: string }) => vo.status)) === 'out_for_delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {summarizeVendorStatus((order.vendor_orders ?? []).map((vo: { status: string }) => vo.status)).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders yet. Orders will appear here when customers place them.
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

