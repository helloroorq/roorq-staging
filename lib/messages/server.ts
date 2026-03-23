import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { ConversationMessage, ConversationPreview } from '@/lib/messages/types'

type ConversationRow = {
  id: string
  buyer_id: string
  seller_id: string
  product_id: string | null
  created_at: string
  updated_at: string
  last_message_at: string | null
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

type ParticipantRow = {
  id: string
  full_name: string | null
  email: string | null
  store_name: string | null
  business_name: string | null
  store_logo_url: string | null
  user_type: string | null
}

type ProductRow = {
  id: string
  name: string
  price: number | null
  images: string[] | null
  vendor_id?: string | null
  is_active?: boolean | null
  approval_status?: string | null
}

const getConversationClient = async () => {
  const supabase = await createClient()
  return {
    supabase,
    privilegedClient: getAdminClient() ?? supabase,
  }
}

const buildParticipantLabel = (participant: ParticipantRow | null, fallback: 'Buyer' | 'Seller') => {
  if (!participant) {
    return fallback
  }

  if (participant.user_type === 'vendor') {
    return participant.store_name || participant.business_name || participant.email || 'Seller'
  }

  return participant.full_name || participant.email || fallback
}

const mapMessage = (message: MessageRow): ConversationMessage => ({
  id: message.id,
  conversationId: message.conversation_id,
  senderId: message.sender_id,
  body: message.body,
  createdAt: message.created_at,
  readAt: message.read_at,
})

export async function listConversationPreviewsForUser(userId: string): Promise<ConversationPreview[]> {
  const { supabase, privilegedClient } = await getConversationClient()
  const { data: conversations, error } = await supabase
    .from('marketplace_conversations')
    .select('id, buyer_id, seller_id, product_id, created_at, updated_at, last_message_at')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })

  if (error) {
    logger.error('Failed to load conversations', { userId, message: error.message, code: error.code })
    return []
  }

  const conversationRows = (conversations as ConversationRow[] | null) ?? []
  if (conversationRows.length === 0) {
    return []
  }

  const conversationIds = conversationRows.map((conversation) => conversation.id)
  const counterpartIds = Array.from(
    new Set(
      conversationRows.map((conversation) =>
        conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id
      )
    )
  )
  const productIds = Array.from(
    new Set(conversationRows.map((conversation) => conversation.product_id).filter(Boolean) as string[])
  )

  const [{ data: messages }, { data: participants }, { data: products }] = await Promise.all([
    supabase
      .from('marketplace_messages')
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }),
    privilegedClient
      .from('users')
      .select('id, full_name, email, store_name, business_name, store_logo_url, user_type')
      .in('id', counterpartIds),
    productIds.length > 0
      ? privilegedClient.from('products').select('id, name, price, images').in('id', productIds)
      : Promise.resolve({ data: [] as ProductRow[] | null }),
  ])

  const lastMessageByConversation = new Map<string, MessageRow>()
  ;((messages as MessageRow[] | null) ?? []).forEach((message) => {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message)
    }
  })

  const participantMap = new Map(
    (((participants as ParticipantRow[] | null) ?? [])).map((participant) => [participant.id, participant])
  )
  const productMap = new Map((((products as ProductRow[] | null) ?? [])).map((product) => [product.id, product]))

  return conversationRows.map((conversation) => {
    const isBuyer = conversation.buyer_id === userId
    const counterpartId = isBuyer ? conversation.seller_id : conversation.buyer_id
    const counterpart = participantMap.get(counterpartId) ?? null
    const product = conversation.product_id ? productMap.get(conversation.product_id) ?? null : null
    const lastMessage = lastMessageByConversation.get(conversation.id) ?? null

    return {
      id: conversation.id,
      buyerId: conversation.buyer_id,
      sellerId: conversation.seller_id,
      productId: conversation.product_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      lastMessageAt: conversation.last_message_at,
      counterpart: {
        id: counterpartId,
        name: buildParticipantLabel(counterpart, isBuyer ? 'Seller' : 'Buyer'),
        subtitle: isBuyer ? 'Seller' : 'Buyer',
        avatarUrl: counterpart?.store_logo_url ?? null,
      },
      product: product
        ? {
            id: product.id,
            name: product.name,
            imageUrl: product.images?.[0] ?? null,
            price: product.price,
          }
        : null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.body,
            createdAt: lastMessage.created_at,
            senderId: lastMessage.sender_id,
            readAt: lastMessage.read_at,
          }
        : null,
    }
  })
}

const getConversationForUser = async (userId: string, conversationId: string) => {
  const supabase = await createClient()
  const { data: conversation, error } = await supabase
    .from('marketplace_conversations')
    .select('id, buyer_id, seller_id, product_id, created_at, updated_at, last_message_at')
    .eq('id', conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle()

  if (error) {
    logger.error('Failed to load conversation', {
      userId,
      conversationId,
      message: error.message,
      code: error.code,
    })
    return null
  }

  return (conversation as ConversationRow | null) ?? null
}

export async function getConversationMessagesForUser(
  userId: string,
  conversationId: string
): Promise<ConversationMessage[] | null> {
  const conversation = await getConversationForUser(userId, conversationId)
  if (!conversation) {
    return null
  }

  const supabase = await createClient()
  const { data: messages, error } = await supabase
    .from('marketplace_messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    logger.error('Failed to load conversation messages', {
      userId,
      conversationId,
      message: error.message,
      code: error.code,
    })
    return []
  }

  const unreadMessageIds = (((messages as MessageRow[] | null) ?? [])).filter(
    (message) => message.sender_id !== userId && !message.read_at
  )

  if (unreadMessageIds.length > 0) {
    await supabase
      .from('marketplace_messages')
      .update({ read_at: new Date().toISOString() })
      .in(
        'id',
        unreadMessageIds.map((message) => message.id)
      )
  }

  return (((messages as MessageRow[] | null) ?? [])).map(mapMessage)
}

export async function getOrCreateConversationForUser(input: {
  userId: string
  sellerId: string
  productId?: string | null
}): Promise<{ conversationId: string } | { error: string }> {
  const { userId, sellerId, productId } = input
  if (userId === sellerId) {
    return { error: 'You cannot message your own listing.' }
  }

  const { supabase, privilegedClient } = await getConversationClient()

  if (productId) {
    const { data: product, error } = await privilegedClient
      .from('products')
      .select('id, vendor_id, is_active, approval_status')
      .eq('id', productId)
      .maybeSingle()

    if (error || !product) {
      return { error: 'That listing is no longer available.' }
    }

    const productRow = product as ProductRow
    if (productRow.vendor_id !== sellerId || productRow.is_active === false || productRow.approval_status === 'rejected') {
      return { error: 'That listing is no longer available.' }
    }
  } else {
    const { data: seller } = await privilegedClient
      .from('users')
      .select('id')
      .eq('id', sellerId)
      .eq('user_type', 'vendor')
      .eq('vendor_status', 'approved')
      .maybeSingle()

    if (!seller) {
      return { error: 'That seller is not available right now.' }
    }
  }

  let existingConversationQuery = supabase
    .from('marketplace_conversations')
    .select('id')
    .eq('buyer_id', userId)
    .eq('seller_id', sellerId)

  existingConversationQuery = productId
    ? existingConversationQuery.eq('product_id', productId)
    : existingConversationQuery.is('product_id', null)

  const { data: existingConversation } = await existingConversationQuery.maybeSingle()

  if (existingConversation?.id) {
    return { conversationId: existingConversation.id as string }
  }

  const { data: createdConversation, error: insertError } = await supabase
    .from('marketplace_conversations')
    .insert({
      buyer_id: userId,
      seller_id: sellerId,
      product_id: productId ?? null,
    })
    .select('id')
    .single()

  if (insertError || !createdConversation?.id) {
    logger.error('Failed to create conversation', {
      userId,
      sellerId,
      productId: productId ?? null,
      message: insertError?.message ?? 'Unknown error',
      code: insertError?.code ?? null,
    })
    return { error: 'Failed to start the conversation. Please try again.' }
  }

  return { conversationId: createdConversation.id as string }
}

export async function sendConversationMessageForUser(input: {
  userId: string
  conversationId: string
  body: string
}): Promise<ConversationMessage | null> {
  const { userId, conversationId } = input
  const body = input.body.trim()

  if (!body) {
    return null
  }

  const conversation = await getConversationForUser(userId, conversationId)
  if (!conversation) {
    return null
  }

  const supabase = await createClient()
  const { data: message, error } = await supabase
    .from('marketplace_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    })
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .single()

  if (error || !message) {
    logger.error('Failed to send conversation message', {
      userId,
      conversationId,
      message: error?.message ?? 'Unknown error',
      code: error?.code ?? null,
    })
    return null
  }

  return mapMessage(message as MessageRow)
}
