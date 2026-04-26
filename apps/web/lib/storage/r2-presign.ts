import 'server-only'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { serverEnv } from '@/lib/env.server'

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

export function isR2Configured(): boolean {
  return Boolean(
    serverEnv.R2_ACCOUNT_ID &&
      serverEnv.R2_ACCESS_KEY_ID &&
      serverEnv.R2_SECRET_ACCESS_KEY &&
      serverEnv.R2_BUCKET &&
      serverEnv.R2_PUBLIC_BASE_URL
  )
}

function getClient() {
  const accountId = serverEnv.R2_ACCOUNT_ID!
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.R2_ACCESS_KEY_ID!,
      secretAccessKey: serverEnv.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function presignMessageAttachmentUpload(input: {
  conversationId: string
  userId: string
  fileName: string
  contentType: string
  size: number
}): Promise<{ uploadUrl: string; publicUrl: string; key: string } | { error: string }> {
  if (!isR2Configured()) {
    return { error: 'Attachment uploads are not configured.' }
  }

  if (input.size > MAX_ATTACHMENT_BYTES) {
    return { error: 'Each attachment must be 5MB or smaller.' }
  }

  if (!input.contentType.startsWith('image/')) {
    return { error: 'Only image attachments are allowed.' }
  }

  const safeBase =
    input.fileName
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 80) || 'image'

  const key = `messages/${input.conversationId}/${input.userId}/${Date.now()}-${safeBase}`

  const client = getClient()
  const command = new PutObjectCommand({
    Bucket: serverEnv.R2_BUCKET!,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 })
  const publicBase = serverEnv.R2_PUBLIC_BASE_URL!.replace(/\/$/, '')
  const publicUrl = `${publicBase}/${key}`

  return { uploadUrl, publicUrl, key }
}

export { MAX_ATTACHMENT_BYTES }
