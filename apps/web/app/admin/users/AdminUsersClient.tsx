'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getOrCreateCsrfToken } from '@/lib/auth/csrf-client'

type AdminUser = {
  id: string
  email: string | null
  full_name: string | null
  role: 'customer' | 'admin' | 'super_admin'
  created_at: string
  updated_at: string | null
}

type AdminUsersClientProps = {
  isSuperAdmin: boolean
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export default function AdminUsersClient({ isSuperAdmin }: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load users.')
      }
      setUsers(data.users ?? [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    setCsrfToken(getOrCreateCsrfToken())
  }, [])

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      const email = user.email?.toLowerCase() ?? ''
      const name = user.full_name?.toLowerCase() ?? ''
      return email.includes(term) || name.includes(term)
    })
  }, [search, users])

  const handleRoleChange = async (userId: string, role: AdminUser['role']) => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can update roles.')
      return
    }
    if (!csrfToken) {
      toast.error('Security token missing. Please refresh.')
      return
    }

    setUpdatingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, csrf: csrfToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role.')
      }
      toast.success('Role updated.')
      await loadUsers()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update role.'))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full md:max-w-sm border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
        <button
          type="button"
          onClick={loadUsers}
          className="text-sm text-gray-600 hover:text-black"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">
                    {user.full_name || 'Unnamed'}
                  </td>
                  <td className="px-4 py-3">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(event) =>
                          handleRoleChange(user.id, event.target.value as AdminUser['role'])
                        }
                        className="border border-gray-300 px-2 py-1 text-sm focus:border-black focus:outline-none"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <span className="uppercase text-xs font-semibold">{user.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
