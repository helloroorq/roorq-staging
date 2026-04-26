export type MessageAttachment = { url: string; mime: string; size: number }

export type ConversationPreview = {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  /** Alias for listing / product id (same FK as products.id). */
  listingId?: string | null
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  unreadCount?: number
  counterpart: {
    id: string
    name: string
    subtitle: string
    avatarUrl: string | null
  }
  product: {
    id: string
    name: string
    imageUrl: string | null
    price: number | null
  } | null
  lastMessage: {
    id: string
    body: string
    createdAt: string
    senderId: string
    senderType?: 'buyer' | 'seller'
    readAt: string | null
  } | null
}

export type ConversationMessage = {
  id: string
  conversationId: string
  senderId: string
  senderType?: 'buyer' | 'seller'
  body: string
  attachments?: MessageAttachment[]
  createdAt: string
  readAt: string | null
}
