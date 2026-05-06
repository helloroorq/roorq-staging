import { getAdminClient } from '@/lib/supabase/admin'

type AuthAuditEvent = {
  userId?: string | null
  identifier?: string | null
  action: string
  status: 'success' | 'failed' | 'blocked'
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

export async function logAuthEvent(event: AuthAuditEvent) {
  const adminClient = getAdminClient()
  if (!adminClient) {
    return
  }

  await adminClient.from('auth_audit_logs').insert({
    user_id: event.userId ?? null,
    identifier: event.identifier ?? null,
    action: event.action,
    status: event.status,
    ip: event.ip ?? null,
    user_agent: event.userAgent ?? null,
    metadata: event.metadata ?? {},
    created_at: new Date().toISOString(),
  })
}
