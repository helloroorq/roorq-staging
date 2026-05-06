import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth/require-admin'
import AdminNav from '@/components/AdminNav'
import { buildMetadata } from '@/lib/seo/metadata'

export const metadata = buildMetadata({
  title: 'Admin Dashboard',
  description: 'Roorq admin operations dashboard.',
  path: '/admin',
  noIndex: true,
})

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // This will redirect to login/home if user is not admin
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Context Banner */}
        <div className="mb-6 bg-black text-white px-4 py-2 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>Logged in as: <strong>{admin.email}</strong></span>
          <span className="bg-white/20 px-2 py-1 rounded uppercase tracking-wider">
            {admin.role.replace('_', ' ')}
          </span>
        </div>
        {children}
      </main>
    </div>
  )
}

