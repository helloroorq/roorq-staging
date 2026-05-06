import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatINR } from '@/lib/utils/currency'
import VendorOrderStatusClient from './VendorOrderStatusClient'

export default async function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('vendor_orders')
    .select(`
      id,
      status,
      subtotal,
      tracking_number,
      tracking_url,
      parent_orders(id, shipping_address, payment_method, payment_status),
      items:vendor_order_items(
        id,
        quantity,
        price_at_purchase,
        product:products(name, images, size)
      )
    `)
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!order) notFound()

  const parentOrder = Array.isArray(order.parent_orders) ? order.parent_orders[0] : order.parent_orders
  const shipping = parentOrder?.shipping_address as { hostel?: string; room?: string; campus?: string } | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <p className="text-gray-500">Status: {order.status.replace(/_/g, ' ')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Items</h2>
          <div className="space-y-4">
            {(order.items ?? []).map((item: any) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                {item.product?.images?.[0] && (
                  <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                    <Image src={item.product.images[0]} alt={item.product?.name ?? 'Product'} fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold">{item.product?.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-sm text-gray-500">Size: {item.product?.size ?? 'N/A'}</p>
                </div>
                <div className="font-bold">{formatINR(item.price_at_purchase * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4 flex justify-between font-bold">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Shipping</h2>
            <p>{shipping?.hostel ?? 'Hostel'}{shipping?.room ? `, Room ${shipping.room}` : ''}</p>
            <p className="text-sm text-gray-500">{shipping?.campus ?? 'IIT Roorkee'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Payment</h2>
            <p className="text-sm text-gray-500">Method: {parentOrder?.payment_method}</p>
            <p className="text-sm text-gray-500">Status: {parentOrder?.payment_status}</p>
          </div>
        </div>
      </div>

      <VendorOrderStatusClient
        orderId={order.id}
        initialStatus={order.status}
        initialTrackingNumber={order.tracking_number}
        initialTrackingUrl={order.tracking_url}
      />
    </div>
  )
}
