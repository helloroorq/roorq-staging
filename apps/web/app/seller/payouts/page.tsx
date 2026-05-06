import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerPayoutsPage() {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: payouts } = await supabase
    .from('vendor_payouts')
    .select('id, payout_period_start, payout_period_end, payout_amount, status, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payouts</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payouts && payouts.length > 0 ? (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4">
                    {payout.payout_period_start} - {payout.payout_period_end}
                  </td>
                  <td className="px-6 py-4 font-semibold">{formatINR(payout.payout_amount)}</td>
                  <td className="px-6 py-4 uppercase text-xs">{payout.status}</td>
                  <td className="px-6 py-4">
                    <Link href={`/seller/payouts/${payout.id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payouts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
