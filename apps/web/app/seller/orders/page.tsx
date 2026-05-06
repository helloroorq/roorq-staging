import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerOrdersPage() {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('vendor_orders')
    .select('id, status, subtotal, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 font-mono">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold">{formatINR(order.subtotal)}</td>
                  <td className="px-6 py-4 uppercase text-xs">{order.status.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    <Link href={`/seller/orders/${order.id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
