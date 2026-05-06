import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { notFound } from 'next/navigation'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerPayoutDetailPage({ params }: { params: { id: string } }) {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: payout } = await supabase
    .from('vendor_payouts')
    .select(`
      id,
      payout_period_start,
      payout_period_end,
      total_orders,
      total_sales,
      total_commission,
      payout_amount,
      status,
      payment_method,
      transaction_reference,
      paid_at,
      line_items:payout_line_items(
        id,
        order_amount,
        commission,
        payout_amount,
        vendor_order:vendor_orders(id)
      )
    `)
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!payout) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout {payout.id.slice(0, 8).toUpperCase()}</h1>
        <p className="text-gray-500">{payout.payout_period_start} - {payout.payout_period_end}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Total sales</p>
          <p className="text-2xl font-bold">{formatINR(payout.total_sales)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Commission</p>
          <p className="text-2xl font-bold">{formatINR(payout.total_commission)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-xs uppercase text-gray-500">Payout amount</p>
          <p className="text-2xl font-bold">{formatINR(payout.payout_amount)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Orders included</h2>
        <div className="space-y-3">
          {(payout.line_items ?? []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm border-b pb-3">
              <div>
                <p className="font-semibold">Order #{item.vendor_order?.id?.slice(0, 8).toUpperCase()}</p>
                <p className="text-gray-500">Commission: {formatINR(item.commission)}</p>
              </div>
              <p className="font-semibold">{formatINR(item.payout_amount)}</p>
            </div>
          ))}
          {(payout.line_items ?? []).length === 0 && <p className="text-gray-500">No line items.</p>}
        </div>
      </div>
    </div>
  )
}
