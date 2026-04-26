import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { presignMessageAttachmentUpload, isR2Configured } from '@/lib/storage/r2-presign'

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
})

async function assertParticipant(userId: string, conversationId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle()
  return Boolean(data?.id)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'File uploads are not configured (set R2_* environment variables).' },
      { status: 503 }
    )
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }

  const ok = await assertParticipant(user.id, params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const result = await presignMessageAttachmentUpload({
    conversationId: params.id,
    userId: user.id,
    fileName: parsed.data.fileName,
    contentType: parsed.data.contentType,
    size: parsed.data.size,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
