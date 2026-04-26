import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  getOrCreateConversationForBuyer,
  getUnreadConversationTotal,
  listConversationPreviewsForUser,
} from '@/lib/conversations/server'

const createConversationSchema = z.object({
  sellerId: z.string().uuid(),
  listingId: z.string().uuid().optional().nullable(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = url.searchParams.get('limit')
  const cursor = url.searchParams.get('cursor')

  const [{ conversations, nextCursor }, unreadTotal] = await Promise.all([
    listConversationPreviewsForUser(user.id, {
      limit: limit ? Number(limit) : undefined,
      cursor,
    }),
    getUnreadConversationTotal(user.id),
  ])

  return NextResponse.json({ conversations, nextCursor, unreadTotal })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = createConversationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const result = await getOrCreateConversationForBuyer({
    buyerId: user.id,
    sellerId: parsed.data.sellerId,
    listingId: parsed.data.listingId ?? null,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ conversationId: result.conversationId })
}
