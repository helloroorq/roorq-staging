import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validateCsrfToken } from '@/lib/auth/csrf'

export const runtime = 'nodejs'

const VendorProfileSchema = z.object({
  storeName: z.string().min(2).max(120),
  storeDescription: z.string().max(500).optional(),
  storeLogoUrl: z.string().url().optional().nullable(),
  storeBannerUrl: z.string().url().optional().nullable(),
  businessName: z.string().min(2).max(140).optional(),
  businessCategory: z.string().min(2).max(120).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().min(6).max(20).optional(),
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

  let payload: z.infer<typeof VendorProfileSchema>
  try {
    payload = VendorProfileSchema.parse(await request.json())
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
      store_name: payload.storeName,
      store_description: payload.storeDescription ?? null,
      store_logo_url: payload.storeLogoUrl ?? null,
      store_banner_url: payload.storeBannerUrl ?? null,
      business_name: payload.businessName ?? payload.storeName,
      business_category: payload.businessCategory ?? null,
      business_email: payload.businessEmail ?? null,
      business_phone: payload.businessPhone ?? null,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
