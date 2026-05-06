import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logAdminAction } from '@/lib/admin/audit'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  approvalStatus: z.enum(['pending', 'approved', 'rejected', 'delisted']),
  rejectionReason: z.string().max(300).optional(),
  csrf: z.string().min(16),
})

const getCurrentUserRole = async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, role: null }
  }

  const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id })
  return { user, role: roleData as string | null }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, role } = await getCurrentUserRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  const adminClient = getAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 })
  }

  const updatePayload: Record<string, string | null> = {
    approval_status: payload.approvalStatus,
    rejection_reason: payload.rejectionReason ?? null,
  }

  if (payload.approvalStatus === 'approved') {
    updatePayload.approved_at = new Date().toISOString()
    updatePayload.approved_by = user.id
  }

  const { error } = await adminClient
    .from('products')
    .update(updatePayload)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }

  await logAdminAction({
    actorId: user.id,
    action: 'product.moderation_updated',
    targetType: 'product',
    targetId: params.id,
    metadata: {
      approvalStatus: payload.approvalStatus,
      rejectionReason: payload.rejectionReason ?? null,
    },
  })

  return NextResponse.json({ success: true })
}
