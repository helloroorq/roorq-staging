import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils/currency';
import ProductApprovalActions from './ProductApprovalActions';

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, price, stock_quantity, images, approval_status, vendor:users(store_name, business_name, email)')
    .order('created_at', { ascending: false });

  const normalizedProducts =
    products?.map((product) => ({
      ...product,
      vendor: Array.isArray(product.vendor) ? product.vendor[0] : product.vendor,
    })) ?? [];

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Products</h1>
          <Link
            href="/admin/products/new"
            className="bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition"
          >
            Add Product
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {normalizedProducts.length > 0 ? (
                  normalizedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.vendor?.store_name || product.vendor?.business_name || product.vendor?.email || '-'}
                      </td>
                      <td className="px-6 py-4">{formatINR(product.price)}</td>
                      <td className="px-6 py-4">{product.stock_quantity}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 uppercase">
                          {product.approval_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                          <ProductApprovalActions productId={product.id} approvalStatus={product.approval_status} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No products yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
