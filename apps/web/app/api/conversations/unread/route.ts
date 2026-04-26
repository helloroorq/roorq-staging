import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUnreadConversationTotal, listConversationPreviewsForUser } from '@/lib/conversations/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [unreadTotal, { conversations }] = await Promise.all([
    getUnreadConversationTotal(user.id),
    listConversationPreviewsForUser(user.id, { limit: 50 }),
  ])

  const unreadConversations = conversations
    .filter((c) => (c.unreadCount ?? 0) > 0)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))
    .slice(0, 5)

  return NextResponse.json({ unreadTotal, unreadConversations })
}
