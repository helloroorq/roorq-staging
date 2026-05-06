import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validateCsrfToken } from '@/lib/auth/csrf'

export const runtime = 'nodejs'

const BankingSchema = z.object({
  bankAccountNumber: z.string().min(6).max(40),
  bankIfsc: z.string().min(5).max(20),
  bankAccountName: z.string().min(2).max(120),
  upiId: z.string().min(3).max(120).optional(),
  csrf: z.string().min(16),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: z.infer<typeof BankingSchema>
  try {
    payload = BankingSchema.parse(await request.json())
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

  const { error } = await adminClient
    .from('users')
    .update({
      bank_account_number: payload.bankAccountNumber,
      bank_ifsc: payload.bankIfsc,
      bank_account_name: payload.bankAccountName,
      upi_id: payload.upiId ?? null,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to update banking' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
