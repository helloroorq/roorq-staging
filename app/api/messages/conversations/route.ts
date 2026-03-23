import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateConversationForUser, listConversationPreviewsForUser } from '@/lib/messages/server'

const createConversationSchema = z.object({
  sellerId: z.string().uuid(),
  productId: z.string().uuid().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversations = await listConversationPreviewsForUser(user.id)
  return NextResponse.json({ conversations })
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

  const result = await getOrCreateConversationForUser({
    userId: user.id,
    sellerId: parsed.data.sellerId,
    productId: parsed.data.productId ?? null,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ conversationId: result.conversationId })
}
