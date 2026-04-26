import 'server-only'

import { getConversationDetailForUser, getOrCreateConversationForBuyer } from '@/lib/conversations/server'

export {
  listConversationPreviewsForUser,
  getUnreadConversationTotal,
  getConversationDetailForUser,
  getMessagesPageForUser,
  sendConversationMessageForUser,
  flagMessageForUser,
} from '@/lib/conversations/server'

export async function getConversationMessagesForUser(userId: string, conversationId: string) {
  const detail = await getConversationDetailForUser(userId, conversationId)
  return detail?.messages ?? null
}

/** @deprecated Prefer getOrCreateConversationForBuyer with listingId */
export async function getOrCreateConversationForUser(input: {
  userId: string
  sellerId: string
  productId?: string | null
}) {
  return getOrCreateConversationForBuyer({
    buyerId: input.userId,
    sellerId: input.sellerId,
    listingId: input.productId ?? null,
  })
}
