import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminOperationsPage() {
  const supabase = await createClient()

  const [ordersQueue, vendorQueue, productQueue, disputesQueue] = await Promise.all([
    supabase
      .from('vendor_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'processing', 'ready_to_ship', 'out_for_delivery']),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'vendor')
      .in('vendor_status', ['pending', 'under_review', 'documents_pending']),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase
      .from('disputes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'investigating', 'waiting_customer', 'waiting_vendor']),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Operations Notes</h1>
        <p className="text-sm text-gray-600 mt-1">
          Lean runbook for day-to-day marketplace operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/orders" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Orders in queue</p>
          <p className="text-2xl font-bold mt-1">{ordersQueue.count ?? 0}</p>
        </Link>
        <Link href="/admin/moderation" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Vendor reviews</p>
          <p className="text-2xl font-bold mt-1">{vendorQueue.count ?? 0}</p>
        </Link>
        <Link href="/admin/moderation" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Product reviews</p>
          <p className="text-2xl font-bold mt-1">{productQueue.count ?? 0}</p>
        </Link>
        <Link href="/admin/disputes" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Open disputes</p>
          <p className="text-2xl font-bold mt-1">{disputesQueue.count ?? 0}</p>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-3">Daily Ops Checklist</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>1) Clear moderation queue first: approve/reject vendors and products within SLA.</li>
          <li>2) Process delivery blockers: assign riders, update delayed orders, and collect COD after delivery.</li>
          <li>3) Resolve disputes in priority order, attach a resolution note, and set final status.</li>
          <li>4) Review pending/failed/refunded payments and escalate anomalies to finance.</li>
          <li>5) Check ops logs for unusual admin actions and auth failures before shift handoff.</li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold mb-3">Escalation Rules</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>Critical disputes over refund threshold should be assigned immediately and resolved same day.</li>
          <li>Vendors with repeated cancellation/fraud signals should move to suspended pending review.</li>
          <li>Any role change to admin/super admin must be visible in Ops Logs for traceability.</li>
        </ul>
      </div>
    </div>
  )
}
