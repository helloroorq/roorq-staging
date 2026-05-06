import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductApprovalActions from '../products/ProductApprovalActions'
import VendorModerationActions from './VendorModerationActions'

export default async function AdminModerationPage() {
  const supabase = await createClient()

  const [{ data: pendingProducts }, { data: vendorQueue }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, approval_status, created_at, vendor:users(store_name, business_name, email)')
      .in('approval_status', ['pending', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('users')
      .select('id, full_name, email, store_name, business_name, vendor_status, vendor_registered_at')
      .eq('user_type', 'vendor')
      .in('vendor_status', ['pending', 'under_review', 'documents_pending'])
      .order('vendor_registered_at', { ascending: false })
      .limit(60),
  ])

  const products =
    pendingProducts?.map((item) => ({
      ...item,
      vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
    })) ?? []

  const vendors = vendorQueue ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Moderation Queue</h1>
        <p className="text-sm text-gray-600 mt-1">
          One place for product and vendor approvals so a small ops team can clear backlog fast.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">Product Review Queue</h2>
          <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
            Full products view
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <Link href={`/admin/products/${product.id}`} className="font-medium text-blue-600 hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.vendor?.store_name || product.vendor?.business_name || product.vendor?.email || '-'}
                    </td>
                    <td className="px-6 py-4 uppercase text-xs">{product.approval_status}</td>
                    <td className="px-6 py-4">
                      <ProductApprovalActions productId={product.id} approvalStatus={product.approval_status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No product moderation tasks right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">Vendor Verification Queue</h2>
          <Link href="/admin/vendors" className="text-sm text-blue-600 hover:underline">
            Full vendor view
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4">
                      <Link href={`/admin/vendors/${vendor.id}`} className="font-medium text-blue-600 hover:underline">
                        {vendor.full_name || vendor.email || 'Vendor'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {vendor.store_name || vendor.business_name || '-'}
                    </td>
                    <td className="px-6 py-4 uppercase text-xs">{vendor.vendor_status}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {vendor.vendor_registered_at
                        ? new Date(vendor.vendor_registered_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <VendorModerationActions vendorId={vendor.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No vendor moderation tasks right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
