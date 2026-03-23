import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getConversationMessagesForUser, sendConversationMessageForUser } from '@/lib/messages/server'

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = await getConversationMessagesForUser(user.id, params.id)
  if (!messages) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ messages })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = sendMessageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const message = await sendConversationMessageForUser({
    userId: user.id,
    conversationId: params.id,
    body: parsed.data.body,
  })

  if (!message) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 400 })
  }

  return NextResponse.json({ message })
}
