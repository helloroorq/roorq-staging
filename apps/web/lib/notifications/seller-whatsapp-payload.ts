export type BuyerMessageWhatsAppPayload = {
  sellerUserId: string
  buyerFirstName: string
  listingTitle: string
  messagePreview: string
  conversationPath: string
}

const preview = (body: string, max = 80) => {
  const t = body.replace(/\s+/g, ' ').trim()
  if (t.length <= max) {
    return t
  }
  return `${t.slice(0, max)}...`
}

/** JSON body for the vendor WhatsApp webhook (stable contract for automation). */
export function buildBuyerMessageWhatsAppJson(input: BuyerMessageWhatsAppPayload, options: { siteBase: string; whatsapp?: string }) {
  const link = `${options.siteBase.replace(/\/$/, '')}${input.conversationPath}`
  const templateBody = `New message from ${input.buyerFirstName} about ${input.listingTitle}: '${preview(input.messagePreview)}' Reply on roorq: ${link}`

  return JSON.stringify({
    channel: 'whatsapp',
    source: 'web',
    event: {
      type: 'buyer_message_to_seller',
      payload: {
        sellerUserId: input.sellerUserId,
        buyerFirstName: input.buyerFirstName,
        listingTitle: input.listingTitle,
        messagePreview: preview(input.messagePreview),
        replyUrl: link,
        templateBody,
        whatsapp: options.whatsapp,
      },
    },
    sentAt: new Date().toISOString(),
  })
}
