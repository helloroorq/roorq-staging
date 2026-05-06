import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Phone, MapPin, Package } from 'lucide-react';
import VendorOrderActionsClient from './VendorOrderActionsClient';
import { formatINR } from '@/lib/utils/currency';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: order } = await supabase
    .from('parent_orders')
    .select(`
      id,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      shipping_address,
      created_at,
      user:users(full_name, email, phone),
      vendor_orders(
        id,
        status,
        subtotal,
        tracking_number,
        tracking_url,
        vendor:users(store_name, business_name, email),
        items:vendor_order_items(
          id,
          quantity,
          price_at_purchase,
          product:products(name, images, size)
        )
      )
    `)
    .eq('id', params.id)
    .single();

  if (!order) notFound();

  const shipping = order.shipping_address as { hostel?: string; room?: string; campus?: string } | null;
  const vendorOrders = order.vendor_orders ?? [];
  const customer = Array.isArray(order.user) ? order.user[0] : order.user;

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold">
          Order #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-gray-500">Placed on {new Date(order.created_at).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {vendorOrders.map((vendorOrder: any) => (
            <div key={vendorOrder.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {vendorOrder.vendor?.store_name || vendorOrder.vendor?.business_name || 'Vendor'}
                  </h2>
                  <p className="text-sm text-gray-500">Vendor order #{vendorOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className="px-3 py-1 text-xs rounded-full uppercase bg-gray-100 text-gray-700">
                  {vendorOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="divide-y">
                {(vendorOrder.items ?? []).map((item: any) => (
                  <div key={item.id} className="py-4 flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative overflow-hidden">
                      {item.product?.images?.[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product?.name || 'Order item'}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{item.product?.name || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-600">Size: {item.product?.size} | Qty: {item.quantity}</p>
                      <p className="font-mono">{formatINR(item.price_at_purchase)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 flex justify-between items-center font-bold text-lg">
                <span>Vendor subtotal</span>
                <span>{formatINR(vendorOrder.subtotal)}</span>
              </div>

              <div className="mt-4">
                <VendorOrderActionsClient
                  orderId={vendorOrder.id}
                  initialStatus={vendorOrder.status}
                  initialTrackingNumber={vendorOrder.tracking_number}
                  initialTrackingUrl={vendorOrder.tracking_url}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Customer</h2>
            <p className="font-bold">{customer?.full_name || 'Guest'}</p>
            <p className="text-gray-600">{customer?.email}</p>
            <div className="flex items-center gap-2 mt-2 text-gray-600">
              <Phone className="w-4 h-4" />
              {customer?.phone || 'No Phone'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Shipping
            </h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold">{shipping?.hostel ?? 'Hostel'}</p>
                  <p>Room {shipping?.room ?? '-'}</p>
                  <p>{shipping?.campus ?? 'IIT Roorkee'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Payment</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Method</span>
              <span className="font-bold uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span className="uppercase font-bold text-gray-700">
                {order.payment_status}
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatINR(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
