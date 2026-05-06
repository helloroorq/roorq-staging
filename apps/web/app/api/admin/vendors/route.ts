import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

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
    .select('id, email, full_name, business_name, store_name, vendor_status, vendor_registered_at, vendor_approved_at')
    .eq('user_type', 'vendor')
    .order('vendor_registered_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load vendors.' }, { status: 500 })
  }

  return NextResponse.json({ vendors: data ?? [] })
}
