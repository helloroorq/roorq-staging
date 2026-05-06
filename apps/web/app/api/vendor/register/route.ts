import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validateCsrfToken } from '@/lib/auth/csrf'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const AddressSchema = z.object({
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(20),
})

const DocumentSchema = z.object({
  documentType: z.enum([
    'pan_card',
    'gst_certificate',
    'bank_proof',
    'address_proof',
    'identity_proof',
    'business_registration',
  ]),
  documentUrl: z.string().url(),
  documentNumber: z.string().optional(),
})

const VendorSignupSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  businessName: z.string().min(2).max(140),
  businessType: z.enum(['individual', 'proprietorship', 'partnership', 'pvt_ltd', 'llp']),
  businessCategory: z.string().min(2).max(100),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(6).max(20),
  panNumber: z.string().min(6).max(20).optional(),
  gstin: z.string().min(5).max(30).optional(),
  storeName: z.string().min(2).max(120).optional(),
  storeDescription: z.string().max(500).optional(),
  bankAccountNumber: z.string().min(6).max(40).optional(),
  bankIfsc: z.string().min(5).max(20).optional(),
  bankAccountName: z.string().min(2).max(120).optional(),
  upiId: z.string().min(3).max(120).optional(),
  pickupAddress: AddressSchema.optional(),
  returnAddress: AddressSchema.optional(),
  documents: z.array(DocumentSchema).optional(),
  csrf: z.string().min(16),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: z.infer<typeof VendorSignupSchema>
  try {
    payload = VendorSignupSchema.parse(await request.json())
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

  const updatePayload = {
    full_name: payload.fullName,
    phone: payload.phone,
    user_type: 'vendor',
    vendor_status: 'under_review',
    vendor_registered_at: new Date().toISOString(),
    business_name: payload.businessName,
    business_type: payload.businessType,
    business_category: payload.businessCategory,
    business_email: payload.businessEmail,
    business_phone: payload.businessPhone,
    pan_number: payload.panNumber ?? null,
    gstin: payload.gstin ?? null,
    store_name: payload.storeName ?? payload.businessName,
    store_description: payload.storeDescription ?? null,
    bank_account_number: payload.bankAccountNumber ?? null,
    bank_ifsc: payload.bankIfsc ?? null,
    bank_account_name: payload.bankAccountName ?? null,
    upi_id: payload.upiId ?? null,
    pickup_address: payload.pickupAddress ?? null,
    return_address: payload.returnAddress ?? payload.pickupAddress ?? null,
    onboarding_step: 5,
  }

  const { error: updateError } = await adminClient
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Failed to update vendor profile' }, { status: 500 })
  }

  // Best-effort vendor projection for newer schema versions.
  const { error: vendorProjectionError } = await adminClient
    .from('vendors')
    .upsert(
      {
        id: user.id,
        display_name: payload.storeName ?? payload.businessName,
        slug: (payload.storeName ?? payload.businessName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80),
        bio: payload.storeDescription ?? null,
        status: 'pending',
      },
      { onConflict: 'id' }
    )

  if (vendorProjectionError) {
    logger.warn('Vendor projection upsert failed', {
      userId: user.id,
      error: vendorProjectionError.message,
    })
  }

  if (payload.documents && payload.documents.length > 0) {
    const dedupedDocuments = Array.from(
      new Map(payload.documents.map((doc) => [doc.documentType, doc])).values()
    )

    const documentsToInsert = dedupedDocuments.map((doc) => ({
      vendor_id: user.id,
      document_type: doc.documentType,
      document_url: doc.documentUrl,
      document_number: doc.documentNumber ?? null,
      status: 'pending',
    }))

    const { error: docError } = await adminClient
      .from('vendor_documents')
      .insert(documentsToInsert)

    if (docError) {
      return NextResponse.json({ error: docError.message || 'Failed to save documents' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
