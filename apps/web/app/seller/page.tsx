import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import Link from 'next/link'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerDashboardPage() {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const [{ data: products }, { data: orders }, { data: notifications }] = await Promise.all([
    supabase.from('products').select('id, approval_status').eq('vendor_id', vendor.id),
    supabase.from('vendor_orders').select('id, status, subtotal, created_at').eq('vendor_id', vendor.id).order('created_at', { ascending: false }),
    supabase.from('vendor_notifications').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(5),
  ])

  const totalProducts = products?.length ?? 0
  const pendingOrders = (orders ?? []).filter((o) => ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.status)).length
  const deliveredOrders = (orders ?? []).filter((o) => o.status === 'delivered')
  const revenue = deliveredOrders.reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600">Store: {vendor.store_name ?? 'Your store'}</p>
        </div>
        <Link href="/seller/products/new" className="bg-black text-white px-5 py-2 text-sm font-bold uppercase">
          Add product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase tracking-widest text-gray-500">Products</p>
          <p className="text-2xl font-bold mt-2">{totalProducts}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase tracking-widest text-gray-500">Pending orders</p>
          <p className="text-2xl font-bold mt-2">{pendingOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase tracking-widest text-gray-500">Revenue (delivered)</p>
          <p className="text-2xl font-bold mt-2">{formatINR(revenue)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase tracking-widest text-gray-500">Profile completion</p>
          <p className="text-2xl font-bold mt-2">{vendor.profile_completion ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(orders ?? []).slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm border-b pb-3">
                <div>
                  <p className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatINR(order.subtotal)}</p>
                  <p className="text-xs uppercase text-gray-500">{order.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
            {(orders ?? []).length === 0 && <p className="text-gray-500">No orders yet.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          <div className="space-y-3">
            {(notifications ?? []).map((note) => (
              <div key={note.id} className="border-b pb-3">
                <p className="font-semibold">{note.title}</p>
                <p className="text-sm text-gray-600">{note.message}</p>
                <p className="text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</p>
              </div>
            ))}
            {(notifications ?? []).length === 0 && <p className="text-gray-500">No notifications.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
