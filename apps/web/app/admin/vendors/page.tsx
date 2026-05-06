import { createClient } from '@/lib/supabase/server'
import VendorListClient from './VendorListClient'

export default async function AdminVendorsPage() {
  const supabase = await createClient()

  const { data: vendors } = await supabase
    .from('users')
    .select('id, email, full_name, business_name, store_name, vendor_status, vendor_registered_at, vendor_approved_at')
    .eq('user_type', 'vendor')
    .order('vendor_registered_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vendors</h1>
      <VendorListClient initialVendors={(vendors as any[]) ?? []} />
    </div>
  )
}
