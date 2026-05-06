type VendorNotificationEvent =
  | {
      type: 'listing_published'
      payload: {
        listingName: string
        listingPrice: number
        listingId?: string
        whatsapp?: string
      }
    }
  | {
      type: 'order_received'
      payload: {
        orderId: string
        amount: number
        buyerName?: string
        whatsapp?: string
      }
    }

const WEBHOOK_URL = process.env.EXPO_PUBLIC_WHATSAPP_WEBHOOK_URL

async function sendToWebhook(event: VendorNotificationEvent) {
  if (!WEBHOOK_URL) return false

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'whatsapp',
      source: 'vendor-app',
      event,
      sentAt: new Date().toISOString(),
    }),
  })

  return response.ok
}

export async function queueVendorNotification(event: VendorNotificationEvent) {
  try {
    const sent = await sendToWebhook(event)
    if (!sent) {
      // Integration point: replace this with a durable queue when automation goes live.
      console.info('[vendor-notification:stub]', JSON.stringify(event))
    }
  } catch (error) {
    console.warn('[vendor-notification:error]', error)
  }
}
