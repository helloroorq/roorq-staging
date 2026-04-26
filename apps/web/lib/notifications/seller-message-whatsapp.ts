import 'server-only'

import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { publicEnv } from '@/lib/env.public'
import {
  buildBuyerMessageWhatsAppJson,
  type BuyerMessageWhatsAppPayload,
} from '@/lib/notifications/seller-whatsapp-payload'

export type { BuyerMessageWhatsAppPayload }

/**
 * Notifies vendor via existing WhatsApp webhook (same shape as vendor-app).
 * Never throws — failures are logged only.
 */
export async function notifySellerOfBuyerMessage(input: BuyerMessageWhatsAppPayload): Promise<void> {
  const webhookUrl =
    process.env.VENDOR_WHATSAPP_WEBHOOK_URL ?? process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL ?? ''

  const siteBase = publicEnv.NEXT_PUBLIC_SITE_URL ?? 'https://roorq.com'

  const admin = getAdminClient()
  let whatsapp: string | undefined
  if (admin) {
    const { data } = await admin
      .from('users')
      .select('business_phone')
      .eq('id', input.sellerUserId)
      .maybeSingle()
    const phone = data && typeof (data as { business_phone?: string }).business_phone === 'string'
      ? (data as { business_phone: string }).business_phone
      : null
    whatsapp = phone?.replace(/\D/g, '').length ? phone : undefined
  }

  const body = buildBuyerMessageWhatsAppJson(input, { siteBase, whatsapp })

  if (!webhookUrl) {
    logger.info('[whatsapp-notify:stub]', { body })
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!response.ok) {
      logger.warn('[whatsapp-notify] Webhook non-OK', { status: response.status })
    }
  } catch (error) {
    logger.warn('[whatsapp-notify] Request failed', error instanceof Error ? { message: error.message } : undefined)
  }
}
