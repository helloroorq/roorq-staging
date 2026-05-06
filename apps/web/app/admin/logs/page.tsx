import { createClient } from '@/lib/supabase/server'

type AdminActionLog = {
  id: string
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor: { email: string | null } | { email: string | null }[] | null
}

type AuthAuditLog = {
  id: string
  action: string
  status: string
  identifier: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const renderMetadata = (value: Record<string, unknown> | null) => {
  if (!value || Object.keys(value).length === 0) return '-'
  return JSON.stringify(value)
}

export default async function AdminLogsPage() {
  const supabase = await createClient()

  const [{ data: adminActions }, { data: authAudits }] = await Promise.all([
    supabase
      .from('admin_action_logs')
      .select('id, action, target_type, target_id, metadata, created_at, actor:users(email)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('auth_audit_logs')
      .select('id, action, status, identifier, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const actionRows = (adminActions ?? []) as AdminActionLog[]
  const authRows = (authAudits ?? []) as AuthAuditLog[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Ops Logs</h1>
        <p className="text-sm text-gray-600 mt-1">
          Lightweight audit trail for admin changes and auth/security events.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold">Admin Action Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {actionRows.length > 0 ? (
                actionRows.map((row) => {
                  const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor
                  return (
                    <tr key={row.id}>
                      <td className="px-6 py-4 text-xs text-gray-600">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">{actor?.email ?? '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.action}</td>
                      <td className="px-6 py-4 text-xs">
                        {row.target_type}
                        {row.target_id ? `:${row.target_id.slice(0, 8)}` : ''}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 max-w-md truncate">
                        {renderMetadata(row.metadata)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No admin actions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold">Auth/Security Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {authRows.length > 0 ? (
                authRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 text-xs text-gray-600">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">{row.action}</td>
                    <td className="px-6 py-4 uppercase text-xs">{row.status}</td>
                    <td className="px-6 py-4 text-xs">{row.identifier ?? '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 max-w-md truncate">
                      {renderMetadata(row.metadata)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No auth events logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
