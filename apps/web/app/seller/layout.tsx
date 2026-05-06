import type { ReactNode } from 'react'
import { requireVendor } from '@/lib/auth/require-vendor'
import VendorNav from '@/components/seller/VendorNav'
import { buildMetadata } from '@/lib/seo/metadata'
import PwaInstallPrompt from '@/components/PwaInstallPrompt'

export const metadata = buildMetadata({
  title: 'Seller Dashboard',
  description: 'Roorq seller dashboard.',
  path: '/seller',
  noIndex: true,
})

export default async function SellerLayout({
  children,
}: {
  children: ReactNode
}) {
  const vendor = await requireVendor()

  return (
    <div className="min-h-screen bg-zinc-50">
      <VendorNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        <div className="mb-6 bg-black text-white px-4 py-2 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>Logged in as: <strong>{vendor.email}</strong></span>
          <span className="bg-white/20 px-2 py-1 rounded uppercase tracking-wider">
            {vendor.vendor_status ?? 'pending'}
          </span>
        </div>
        {children}
      </main>
      <PwaInstallPrompt />
    </div>
  )
}
