import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient, applyRouteHandlerCookies } from '@/lib/supabase/route'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const STORAGE_BUCKET = 'vendor-documents'

const DocTypeSchema = z.enum([
  'pan_card',
  'gst_certificate',
  'bank_proof',
  'address_proof',
  'identity_proof',
  'business_registration',
])

const AllowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const getFileExtension = (fileName: string, fallbackType: string) => {
  const extFromName = fileName.split('.').pop()
  if (extFromName && extFromName.length <= 10) {
    return extFromName.toLowerCase()
  }

  if (fallbackType === 'image/jpeg') return 'jpg'
  if (fallbackType === 'image/png') return 'png'
  if (fallbackType === 'image/webp') return 'webp'
  if (fallbackType === 'application/pdf') return 'pdf'

  return 'bin'
}

export async function POST(request: NextRequest) {
  const { supabase, cookiesToSet } = createRouteHandlerClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = getAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const rawDocType = formData.get('docType')
  const persist = formData.get('persist') === 'true'
  const documentNumber = typeof formData.get('documentNumber') === 'string' ? formData.get('documentNumber') : undefined

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  }

  if (typeof rawDocType !== 'string') {
    return NextResponse.json({ error: 'Document type is required.' }, { status: 400 })
  }

  const docTypeResult = DocTypeSchema.safeParse(rawDocType)
  if (!docTypeResult.success) {
    return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File is too large. Max size is 10MB.' }, { status: 413 })
  }

  if (file.type && !AllowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 415 })
  }

  const ext = getFileExtension(file.name, file.type)
  const filePath = `${user.id}/${docTypeResult.data}-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: '3600',
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message || 'Upload failed.' }, { status: 500 })
  }

  const { data: publicUrl } = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
  const documentUrl = publicUrl?.publicUrl ?? filePath

  if (persist) {
    const { error: insertError } = await adminClient
      .from('vendor_documents')
      .insert({
        vendor_id: user.id,
        document_type: docTypeResult.data,
        document_url: documentUrl,
        document_number: documentNumber ?? null,
        status: 'pending',
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message || 'Failed to save document.' }, { status: 500 })
    }
  }

  const response = NextResponse.json({ path: filePath, publicUrl: publicUrl?.publicUrl ?? null })
  return applyRouteHandlerCookies(response, cookiesToSet)
}
