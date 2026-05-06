import { createClient } from '@/lib/supabase/server'
import { requireVendor } from '@/lib/auth/require-vendor'
import Link from 'next/link'

export default async function SellerOnboardingPage() {
  const vendor = await requireVendor()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('vendor_status, profile_completion, store_name')
    .eq('id', vendor.id)
    .single()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Onboarding</h1>
      <p className="text-gray-600">Status: {profile?.vendor_status ?? 'pending'}</p>

      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Profile completion</p>
        <p className="text-2xl font-bold">{profile?.profile_completion ?? 0}%</p>
        <div className="mt-4 flex gap-3">
          <Link href="/seller/settings/profile" className="bg-black text-white px-4 py-2 text-sm font-bold uppercase">Update profile</Link>
          <Link href="/seller/settings/documents" className="border border-gray-300 px-4 py-2 text-sm font-bold uppercase">Upload documents</Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Next steps</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>1. Complete profile and upload KYC documents.</li>
          <li>2. Wait for approval (24-48 hours).</li>
          <li>3. Once approved, list your first product.</li>
        </ul>
      </div>
    </div>
  )
}
