import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import OrderSuccessConfetti from '@/components/OrderSuccessConfetti';
import { AlertCircle } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { logger } from '@/lib/logger';
import { formatINR } from '@/lib/utils/currency';
import VendorReviewCard from './VendorReviewCard';

export const metadata = buildMetadata({
  title: 'Order Details',
  description: 'View your order status and delivery details.',
  path: '/orders',
  noIndex: true,
});

type VendorOrderItem = {
  id: string;
  quantity: number;
  price_at_purchase: number;
  product?: {
    name: string | null;
    size: string | null;
    images: string[] | null;
  } | null;
};

type VendorOrder = {
  id: string;
  vendor_id: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number | null;
  tracking_number: string | null;
  tracking_url: string | null;
  vendor?: {
    store_name: string | null;
    business_name: string | null;
    email: string | null;
  } | null;
  items?: VendorOrderItem[];
};

type ExistingReview = {
  id: string;
  vendor_order_id: string;
  rating: number;
  review_text: string | null;
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

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
            <a href={`/auth?redirect=/orders/${params.id}`} className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest">
              Login to View Order
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch parent order first. Keep this query minimal and resilient.
  const { data: order, error } = await supabase
    .from('parent_orders')
    .select(`
      id,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      shipping_address,
      created_at
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    if (error?.code === 'PGRST116') {
      notFound();
    }
    logger.error('Order fetch error', error instanceof Error ? error : undefined);
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Order</h2>
            <p className="text-gray-600 mb-6">We couldn't retrieve the order details. This might be a temporary issue or the order doesn't exist.</p>
            <a href="/orders" className="text-blue-600 hover:underline font-bold">Return to Orders</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Fetch vendor order details separately. If this fails, show parent order anyway.
  const { data: rawVendorOrders, error: vendorOrdersError } = await supabase
    .from('vendor_orders')
    .select(`
      id,
      vendor_id,
      status,
      subtotal,
      shipping_fee,
      tracking_number,
      tracking_url,
      items:vendor_order_items (
        id,
        quantity,
        price_at_purchase,
        product:products (name, size, images)
      )
    `)
    .eq('parent_order_id', order.id);

  if (vendorOrdersError) {
    logger.warn('Vendor orders fetch failed', vendorOrdersError instanceof Error ? vendorOrdersError : undefined);
  }

  const shipping = order.shipping_address as { hostel?: string; room?: string; phone?: string; campus?: string } | null;
  const vendorOrders: VendorOrder[] =
    (rawVendorOrders ?? []).map((vendorOrder: any) => ({
      ...vendorOrder,
      vendor: null,
      items: (vendorOrder.items ?? []).map((item: any) => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      })),
    })) ?? [];

  const vendorOrderIds = vendorOrders.map((vendorOrder) => vendorOrder.id);
  const { data: existingReviews } = vendorOrderIds.length
    ? await supabase
        .from('vendor_reviews')
        .select('id, vendor_order_id, rating, review_text')
        .eq('user_id', user.id)
        .in('vendor_order_id', vendorOrderIds)
    : { data: [] as ExistingReview[] };

  const reviewMap = new Map<string, ExistingReview>();
  (existingReviews ?? []).forEach((review) => {
    reviewMap.set(review.vendor_order_id, review as ExistingReview);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-4">
          Order #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-gray-500 mb-8">Placed on {new Date(order.created_at).toLocaleString()}</p>

        <OrderSuccessConfetti />

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">Address</p>
              <p className="font-medium">
                {shipping?.hostel ?? 'Hostel'}{shipping?.room ? `, Room ${shipping.room}` : ''}
              </p>
              <p className="text-gray-500">{shipping?.campus ?? 'IIT Roorkee'}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">Payment</p>
              <p className="font-medium uppercase">{order.payment_method}</p>
              <p className="text-xs font-bold uppercase text-gray-600">
                Status: {order.payment_status}
              </p>
            </div>
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount</span>
                <span>{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {vendorOrders.length === 0 ? (
            <div className="text-center text-gray-500">No vendor orders found.</div>
          ) : (
            vendorOrders.map((vendorOrder) => (
              <div key={vendorOrder.id} className="border rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Vendor Order</h2>
                    <p className="text-sm text-gray-500">Order #{vendorOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className="px-3 py-1 rounded text-sm font-semibold bg-gray-100 text-gray-700">
                    {statusLabel[vendorOrder.status] ?? vendorOrder.status}
                  </span>
                </div>

                <div className="space-y-4">
                  {(vendorOrder.items ?? []).map((item) => (
                    <div key={item.id} className="flex gap-4 border-b pb-4">
                      {item.product?.images && item.product.images.length > 0 && (
                        <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name ?? 'Product'}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{item.product?.name ?? 'Product'}</h3>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                        <p className="text-gray-600 text-sm">Size: {item.product?.size ?? 'N/A'}</p>
                      </div>
                      <div className="text-right font-bold">
                        {formatINR(item.price_at_purchase * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold">
                  <span>Vendor subtotal</span>
                  <span>{formatINR(vendorOrder.subtotal)}</span>
                </div>

                {vendorOrder.tracking_number && (
                  <div className="mt-4 text-sm text-gray-600">
                    Tracking: {vendorOrder.tracking_number}{' '}
                    {vendorOrder.tracking_url && (
                      <a className="text-blue-600 hover:underline" href={vendorOrder.tracking_url} target="_blank" rel="noreferrer">
                        View tracking
                      </a>
                    )}
                  </div>
                )}

                {vendorOrder.status === 'delivered' && (
                  <VendorReviewCard
                    vendorOrderId={vendorOrder.id}
                    initialReview={
                      reviewMap.has(vendorOrder.id)
                        ? {
                            rating: reviewMap.get(vendorOrder.id)!.rating,
                            reviewText: reviewMap.get(vendorOrder.id)!.review_text,
                          }
                        : null
                    }
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
