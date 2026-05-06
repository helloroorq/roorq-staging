import { requireAdmin } from '@/lib/auth/require-admin'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const admin = await requireAdmin()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Access</h1>
        <p className="text-sm text-gray-600 mt-1">
          Promote or revoke admin roles. Only super admins can make changes.
        </p>
      </div>
      <AdminUsersClient isSuperAdmin={admin.role === 'super_admin'} />
    </div>
  )
}
