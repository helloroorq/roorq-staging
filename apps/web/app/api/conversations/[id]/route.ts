import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConversationDetailForUser } from '@/lib/conversations/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const detail = await getConversationDetailForUser(user.id, params.id)
  if (!detail) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}
