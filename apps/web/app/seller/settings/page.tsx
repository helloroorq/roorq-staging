import Link from 'next/link'

export default function SellerSettingsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/seller/settings/profile" className="border p-6 bg-white shadow">
          <h2 className="text-lg font-bold mb-2">Store Profile</h2>
          <p className="text-sm text-gray-600">Update your store name, description, and branding.</p>
        </Link>
        <Link href="/seller/settings/banking" className="border p-6 bg-white shadow">
          <h2 className="text-lg font-bold mb-2">Banking</h2>
          <p className="text-sm text-gray-600">Manage payout account details.</p>
        </Link>
        <Link href="/seller/settings/documents" className="border p-6 bg-white shadow">
          <h2 className="text-lg font-bold mb-2">Documents</h2>
          <p className="text-sm text-gray-600">Upload and track KYC documents.</p>
        </Link>
      </div>
    </div>
  )
}
