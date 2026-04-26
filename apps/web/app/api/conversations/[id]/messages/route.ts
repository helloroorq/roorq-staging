import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMessagesPageForUser, sendConversationMessageForUser } from '@/lib/conversations/server'

const attachmentSchema = z.object({
  url: z.string().url(),
  mime: z.string().min(1),
  size: z.number().int().positive().max(5 * 1024 * 1024),
})

const sendMessageSchema = z
  .object({
    body: z.string().max(2000).optional().default(''),
    attachments: z.array(attachmentSchema).max(8).optional().default([]),
  })
  .refine((data) => data.body.trim().length > 0 || data.attachments.length > 0, {
    message: 'Message cannot be empty.',
  })

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const limit = url.searchParams.get('limit')

  const page = await getMessagesPageForUser(user.id, params.id, {
    cursor,
    limit: limit ? Number(limit) : undefined,
  })

  if (!page) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json(page)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const result = await sendConversationMessageForUser({
    userId: user.id,
    conversationId: params.id,
    body: parsed.data.body ?? '',
    attachments: parsed.data.attachments,
  })

  if (!result.ok) {
    if (result.code === 'OFF_PLATFORM_BLOCKED') {
      return NextResponse.json(
        { error: result.message, code: 'OFF_PLATFORM_BLOCKED' },
        { status: 400 }
      )
    }
    const status = result.code === 'NOT_FOUND' ? 404 : 400
    return NextResponse.json({ error: result.message, code: result.code }, { status })
  }

  return NextResponse.json({ message: result.message })
}
