'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

export type VendorRow = {
  id: string
  email: string | null
  full_name: string | null
  business_name: string | null
  store_name: string | null
  vendor_status: string | null
  vendor_registered_at: string | null
  vendor_approved_at: string | null
}

type VendorListClientProps = {
  initialVendors: VendorRow[]
}

export default function VendorListClient({ initialVendors }: VendorListClientProps) {
  const [vendors, setVendors] = useState(initialVendors)
  const supabase = useMemo(() => createClient(), [])
  const [csrf] = useState(getOrCreateCsrfToken())

  const updateVendor = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, csrf }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update vendor')

      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, vendor_status: status } : v)))
      toast.success('Vendor updated')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td className="px-6 py-4">
                <p className="font-semibold">{vendor.full_name ?? vendor.email}</p>
                <p className="text-xs text-gray-500">{vendor.email}</p>
              </td>
              <td className="px-6 py-4">
                {vendor.store_name ?? vendor.business_name ?? '-'}
              </td>
              <td className="px-6 py-4 uppercase text-xs">{vendor.vendor_status}</td>
              <td className="px-6 py-4 flex flex-wrap gap-2">
                <button onClick={() => updateVendor(vendor.id, 'approved')} className="text-green-700 text-xs font-bold uppercase">Approve</button>
                <button onClick={() => updateVendor(vendor.id, 'rejected')} className="text-red-600 text-xs font-bold uppercase">Reject</button>
                <button onClick={() => updateVendor(vendor.id, 'suspended')} className="text-gray-600 text-xs font-bold uppercase">Suspend</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
