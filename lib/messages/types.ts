export type ConversationPreview = {
  id: string
  buyerId: string
  sellerId: string
  productId: string | null
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
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
    readAt: string | null
  } | null
}

export type ConversationMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  readAt: string | null
}
