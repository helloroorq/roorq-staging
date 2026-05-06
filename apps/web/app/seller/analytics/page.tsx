import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerAnalyticsPage() {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: analytics } = await supabase
    .from('vendor_analytics')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('date', { ascending: false })
    .limit(7)

  const totals = (analytics ?? []).reduce(
    (acc, row) => {
      acc.gross += Number(row.gross_sales ?? 0)
      acc.net += Number(row.net_revenue ?? 0)
      acc.orders += Number(row.orders_received ?? 0)
      return acc
    },
    { gross: 0, net: 0, orders: 0 }
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Last 7 days sales</p>
          <p className="text-2xl font-bold">{formatINR(totals.gross)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Net revenue</p>
          <p className="text-2xl font-bold">{formatINR(totals.net)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Orders</p>
          <p className="text-2xl font-bold">{totals.orders}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Daily breakdown</h2>
        <div className="space-y-3">
          {(analytics ?? []).map((row) => (
            <div key={row.id} className="flex justify-between text-sm border-b pb-3">
              <div>
                <p className="font-semibold">{row.date}</p>
                <p className="text-gray-500">Orders: {row.orders_received}</p>
              </div>
              <p className="font-semibold">{formatINR(row.gross_sales)}</p>
            </div>
          ))}
          {(analytics ?? []).length === 0 && <p className="text-gray-500">No analytics yet.</p>}
        </div>
      </div>
    </div>
  )
}
