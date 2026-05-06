import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logAdminAction } from '@/lib/admin/audit'

export const runtime = 'nodejs'

const hasAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin'

const UpdateSchema = z
  .object({
    status: z
      .enum(['open', 'investigating', 'waiting_customer', 'waiting_vendor', 'resolved', 'rejected'])
      .optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    resolutionNote: z.string().trim().max(500).optional(),
    refundAmount: z.number().min(0).max(100000).optional(),
    csrf: z.string().min(16),
  })
  .refine((data) => data.status || data.priority || data.assignedTo !== undefined || data.resolutionNote || data.refundAmount !== undefined, {
    message: 'No updates provided',
  })

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsedId = z.string().uuid().safeParse(params.id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid dispute id' }, { status: 400 })
  }

  let payload: z.infer<typeof UpdateSchema>
  try {
    payload = UpdateSchema.parse(await request.json())
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const csrfCheck = validateCsrfToken(request, payload.csrf)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', { user_id: user.id })
  if (roleError || !hasAdminRole(roleData)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: currentDispute, error: fetchError } = await supabase
    .from('disputes')
    .select('id, status, assigned_to')
    .eq('id', params.id)
    .single()

  if (fetchError || !currentDispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  const updates: Record<string, string | number | null> = {
    last_action_at: new Date().toISOString(),
  }

  if (payload.status) {
    updates.status = payload.status
    if (payload.status === 'resolved' || payload.status === 'rejected') {
      updates.resolved_at = new Date().toISOString()
      updates.resolved_by = user.id
    }
  }

  if (payload.priority) {
    updates.priority = payload.priority
  }

  if (payload.assignedTo !== undefined) {
    updates.assigned_to = payload.assignedTo
  }

  if (payload.resolutionNote) {
    updates.resolution_note = payload.resolutionNote
  }

  if (payload.refundAmount !== undefined) {
    updates.refund_amount = payload.refundAmount
  }

  const { data: updated, error: updateError } = await supabase
    .from('disputes')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || 'Failed to update dispute' }, { status: 500 })
  }

  await logAdminAction({
    actorId: user.id,
    action: 'dispute.updated',
    targetType: 'dispute',
    targetId: params.id,
    metadata: {
      status: payload.status ?? null,
      priority: payload.priority ?? null,
      assignedTo: payload.assignedTo ?? currentDispute.assigned_to ?? null,
      refundAmount: payload.refundAmount ?? null,
    },
  })

  return NextResponse.json({ success: true, dispute: updated })
}
