import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AdminVendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      business_name,
      store_name,
      vendor_status,
      business_category,
      business_email,
      business_phone,
      gstin,
      pan_number,
      vendor_registered_at
    `)
    .eq('id', params.id)
    .single()

  if (!vendor) notFound()

  const { data: documents } = await supabase
    .from('vendor_documents')
    .select('id, document_type, document_url, status, uploaded_at')
    .eq('vendor_id', params.id)
    .order('uploaded_at', { ascending: false })

  const { data: products } = await supabase
    .from('products')
    .select('id, name, approval_status')
    .eq('vendor_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <Link href="/admin/vendors" className="text-gray-500 hover:text-black">Back to Vendors</Link>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">{vendor.store_name ?? vendor.business_name ?? vendor.full_name}</h1>
        <p className="text-sm text-gray-500">{vendor.email}</p>
        <p className="text-xs uppercase text-gray-500 mt-2">Status: {vendor.vendor_status}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <div className="space-y-2">
          {(documents ?? []).map((doc) => (
            <div key={doc.id} className="flex justify-between text-sm border-b pb-2">
              <span className="uppercase">{doc.document_type.replace(/_/g, ' ')}</span>
              <a className="text-blue-600 hover:underline" href={doc.document_url} target="_blank" rel="noreferrer">View</a>
            </div>
          ))}
          {(documents ?? []).length === 0 && <p className="text-gray-500">No documents uploaded.</p>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Products</h2>
        <div className="space-y-2">
          {(products ?? []).map((product) => (
            <div key={product.id} className="flex justify-between text-sm border-b pb-2">
              <span>{product.name}</span>
              <span className="uppercase text-xs">{product.approval_status}</span>
            </div>
          ))}
          {(products ?? []).length === 0 && <p className="text-gray-500">No products listed.</p>}
        </div>
      </div>
    </div>
  )
}
