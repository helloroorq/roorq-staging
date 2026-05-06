import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/currency';
import { buildMetadata } from '@/lib/seo/metadata';

type VendorOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

const summarizeVendorStatus = (statuses: VendorOrderStatus[]) => {
  if (statuses.length === 0) return 'pending';
  const unique = new Set(statuses);
  if (unique.size === 1) return statuses[0];
  if (statuses.every((status) => status === 'delivered')) return 'delivered';
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.some((status) => status === 'out_for_delivery' || status === 'shipped')) {
    return 'out_for_delivery';
  }
  if (statuses.some((status) => status === 'processing' || status === 'ready_to_ship' || status === 'confirmed')) {
    return 'processing';
  }
  return 'pending';
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const metadata = buildMetadata({
  title: 'My Orders',
  description: 'Your Roorq order history.',
  path: '/orders',
  noIndex: true,
});

export default async function OrdersPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your orders</p>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from('parent_orders')
    .select('id, order_number, total_amount, payment_status, payment_method, created_at, vendor_orders(status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">My Orders</h1>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const statuses = (order.vendor_orders ?? []).map((vo: { status: VendorOrderStatus }) => vo.status);
              const summaryStatus = summarizeVendorStatus(statuses);
              return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block border rounded-lg p-6 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Order #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      {statuses.length} vendor{statuses.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold mb-2">{formatINR(order.total_amount)}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        summaryStatus === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : summaryStatus === 'cancelled' || summaryStatus === 'returned'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {(statusLabel[summaryStatus] ?? summaryStatus).toUpperCase()}
                    </span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
            <Link
              href="/shop"
              className="inline-block bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
