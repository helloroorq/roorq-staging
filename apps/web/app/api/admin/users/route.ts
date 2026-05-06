import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logAdminAction } from '@/lib/admin/audit'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['customer', 'admin', 'super_admin']),
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

export async function GET() {
  const { user, role } = await getCurrentUserRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = getAdminClient()
  const db = adminClient ?? (await createClient())

  const { data, error } = await db
    .from('users')
    .select('id, email, full_name, role, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }

  return NextResponse.json({ users: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  const { user, role } = await getCurrentUserRole()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (role !== 'super_admin') {
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

  if (payload.userId === user.id && payload.role !== 'super_admin') {
    return NextResponse.json({ error: 'Cannot remove your own super admin access.' }, { status: 400 })
  }

  const adminClient = getAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Admin operations unavailable.' }, { status: 500 })
  }

  const { error } = await adminClient
    .from('users')
    .update({ role: payload.role })
    .eq('id', payload.userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to update role.' }, { status: 500 })
  }

  await logAdminAction({
    actorId: user.id,
    action: 'user.role_updated',
    targetType: 'user',
    targetId: payload.userId,
    metadata: { role: payload.role },
  })

  return NextResponse.json({ success: true })
}
