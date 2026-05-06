import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import { formatINR } from '@/lib/utils/currency'

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const vendor = await requireVendor()
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, name, price, approval_status, stock_quantity, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (searchParams.status) {
    query = query.eq('approval_status', searchParams.status)
  }

  const { data: products } = await query

  const filters = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Delisted', value: 'delisted' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/seller/products/new" className="bg-black text-white px-4 py-2 text-sm font-bold uppercase">
          Add product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={`/seller/products${filter.value ? `?status=${filter.value}` : ''}`}
            className={`px-4 py-2 rounded text-sm font-medium ${
              (searchParams.status ?? '') === filter.value
                ? 'bg-black text-white'
                : 'bg-white text-black border border-gray-300'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{product.name}</td>
                  <td className="px-6 py-4">{formatINR(product.price)}</td>
                  <td className="px-6 py-4">{product.stock_quantity ?? 0}</td>
                  <td className="px-6 py-4 uppercase text-xs">{product.approval_status}</td>
                  <td className="px-6 py-4">
                    <Link href={`/seller/products/${product.id}/edit`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
