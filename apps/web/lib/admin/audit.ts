import { getAdminClient } from '@/lib/supabase/admin'

type AdminActionEvent = {
  actorId: string
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown>
}

export async function logAdminAction(event: AdminActionEvent) {
  const adminClient = getAdminClient()
  if (!adminClient) {
    return
  }

  await adminClient.from('admin_action_logs').insert({
    actor_id: event.actorId,
    action: event.action,
    target_type: event.targetType,
    target_id: event.targetId ?? null,
    metadata: event.metadata ?? {},
    created_at: new Date().toISOString(),
  })
}
