import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { notFound } from 'next/navigation'
import VendorProductForm from '@/components/seller/ProductForm'

export default async function EditSellerProductPage({ params }: { params: { id: string } }) {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price, vendor_price, category, size, condition, stock_quantity, images, shipping_time_days')
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!product) notFound()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
      <VendorProductForm initialData={product} />
    </div>
  )
}
