import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  detectOffPlatformContent,
  OFF_PLATFORM_USER_MESSAGE,
} from '@/lib/messaging/off-platform-filter'
import { recordPolicyViolation } from '@/lib/messaging/policy-violations'
import { notifySellerOfBuyerMessage } from '@/lib/notifications/seller-message-whatsapp'
import type { ConversationMessage, ConversationPreview, MessageAttachment } from '@/lib/messages/types'
import {
  decodeConversationListCursor,
  encodeConversationListCursor,
} from '@/lib/conversations/list-cursor'

export { OFF_PLATFORM_USER_MESSAGE }
export type { MessageAttachment }
export { encodeConversationListCursor, decodeConversationListCursor }

type ConversationRow = {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string | null
  created_at: string
  last_message_at: string
  buyer_unread_count: number
  seller_unread_count: number
}

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'buyer' | 'seller'
  body: string
  attachments: unknown
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

const DEFAULT_PAGE = 20
const DETAIL_MESSAGE_LIMIT = 50

const getClients = async () => {
  const supabase = await createClient()
  return { supabase, admin: getAdminClient() ?? supabase }
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
  senderType: message.sender_type,
  body: message.body,
  attachments: Array.isArray(message.attachments)
    ? (message.attachments as MessageAttachment[])
    : [],
  createdAt: message.created_at,
  readAt: message.read_at,
})

export async function listConversationPreviewsForUser(
  userId: string,
  opts?: { limit?: number; cursor?: string | null }
): Promise<{ conversations: ConversationPreview[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_PAGE, 1), 50)
  const offset = decodeConversationListCursor(opts?.cursor ?? null)

  const { supabase, admin } = await getClients()
  const { data: conversationData, error } = await supabase
    .from('conversations')
    .select(
      'id, buyer_id, seller_id, listing_id, created_at, last_message_at, buyer_unread_count, seller_unread_count'
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    logger.error('Failed to load conversations', { userId, message: error.message, code: error.code })
    return { conversations: [], nextCursor: null }
  }

  const rows = (conversationData as ConversationRow[] | null) ?? []
  const hasMore = rows.length > limit
  const displayRows = hasMore ? rows.slice(0, limit) : rows
  const next = hasMore ? encodeConversationListCursor(offset + limit) : null

  if (displayRows.length === 0) {
    return { conversations: [], nextCursor: null }
  }

  const conversationIds = displayRows.map((c) => c.id)
  const counterpartIds = Array.from(
    new Set(displayRows.map((c) => (c.buyer_id === userId ? c.seller_id : c.buyer_id)))
  )
  const listingIds = Array.from(new Set(displayRows.map((c) => c.listing_id).filter(Boolean) as string[]))

  const [{ data: messageRows }, { data: participants }, { data: products }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, body, attachments, created_at, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false }),
    admin
      .from('users')
      .select('id, full_name, email, store_name, business_name, store_logo_url, user_type')
      .in('id', counterpartIds),
    listingIds.length > 0
      ? admin.from('products').select('id, name, price, images').in('id', listingIds)
      : Promise.resolve({ data: [] as ProductRow[] | null }),
  ])

  const lastMessageByConversation = new Map<string, MessageRow>()
  ;((messageRows as MessageRow[] | null) ?? []).forEach((message) => {
    if (!lastMessageByConversation.has(message.conversation_id)) {
      lastMessageByConversation.set(message.conversation_id, message)
    }
  })

  const participantMap = new Map(
    ((participants as ParticipantRow[] | null) ?? []).map((participant) => [participant.id, participant])
  )
  const productMap = new Map(((products as ProductRow[] | null) ?? []).map((product) => [product.id, product]))

  const conversations: ConversationPreview[] = displayRows.map((conversation) => {
    const isBuyer = conversation.buyer_id === userId
    const counterpartId = isBuyer ? conversation.seller_id : conversation.buyer_id
    const counterpart = participantMap.get(counterpartId) ?? null
    const product = conversation.listing_id ? productMap.get(conversation.listing_id) ?? null : null
    const lastMessage = lastMessageByConversation.get(conversation.id) ?? null
    const unreadCount = isBuyer ? conversation.buyer_unread_count : conversation.seller_unread_count

    return {
      id: conversation.id,
      buyerId: conversation.buyer_id,
      sellerId: conversation.seller_id,
      productId: conversation.listing_id,
      listingId: conversation.listing_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.last_message_at,
      lastMessageAt: conversation.last_message_at,
      unreadCount,
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
            senderType: lastMessage.sender_type,
            readAt: lastMessage.read_at,
          }
        : null,
    }
  })

  return { conversations, nextCursor: next }
}

export async function getUnreadConversationTotal(userId: string): Promise<number> {
  const { supabase } = await getClients()
  const { data, error } = await supabase
    .from('conversations')
    .select('buyer_unread_count, seller_unread_count, buyer_id')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

  if (error || !data) {
    return 0
  }

  return (data as { buyer_unread_count: number; seller_unread_count: number; buyer_id: string }[]).reduce(
    (sum, row) => sum + (row.buyer_id === userId ? row.buyer_unread_count : row.seller_unread_count),
    0
  )
}

const getConversationRowForUser = async (userId: string, conversationId: string) => {
  const supabase = await createClient()
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select(
      'id, buyer_id, seller_id, listing_id, created_at, last_message_at, buyer_unread_count, seller_unread_count'
    )
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

export async function markConversationReadForUser(userId: string, conversationId: string): Promise<void> {
  const conversation = await getConversationRowForUser(userId, conversationId)
  if (!conversation) {
    return
  }

  const supabase = await createClient()
  const isBuyer = conversation.buyer_id === userId

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null)

  await supabase
    .from('conversations')
    .update(isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 })
    .eq('id', conversationId)
}

export async function getConversationDetailForUser(
  userId: string,
  conversationId: string
): Promise<{
  conversation: ConversationPreview
  messages: ConversationMessage[]
} | null> {
  const conversation = await getConversationRowForUser(userId, conversationId)
  if (!conversation) {
    return null
  }

  await markConversationReadForUser(userId, conversationId)

  const supabase = await createClient()
  const { data: messageRows, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, sender_type, body, attachments, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(DETAIL_MESSAGE_LIMIT)

  if (error) {
    logger.error('Failed to load messages', { conversationId, message: error.message })
    return null
  }

  const messages = ((messageRows as MessageRow[] | null) ?? []).map(mapMessage).reverse()

  const preview = await buildSingleConversationPreview(userId, conversation)
  if (!preview) {
    return null
  }

  return { conversation: { ...preview, unreadCount: 0 }, messages }
}

async function buildSingleConversationPreview(
  userId: string,
  conversation: ConversationRow
): Promise<ConversationPreview | null> {
  const { supabase, admin } = await getClients()
  const isBuyer = conversation.buyer_id === userId
  const counterpartId = isBuyer ? conversation.seller_id : conversation.buyer_id

  const [{ data: counterpart }, { data: product }, { data: lastMsgs }] = await Promise.all([
    admin
      .from('users')
      .select('id, full_name, email, store_name, business_name, store_logo_url, user_type')
      .eq('id', counterpartId)
      .maybeSingle(),
    conversation.listing_id
      ? admin.from('products').select('id, name, price, images').eq('id', conversation.listing_id).maybeSingle()
      : Promise.resolve({ data: null as ProductRow | null }),
    supabase
      .from('messages')
      .select('id, conversation_id, sender_id, sender_type, body, attachments, created_at, read_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const p = counterpart as ParticipantRow | null
  const prod = product as ProductRow | null
  const lastRow = ((lastMsgs as MessageRow[] | null) ?? [])[0] ?? null
  const unreadCount = isBuyer ? conversation.buyer_unread_count : conversation.seller_unread_count

  return {
    id: conversation.id,
    buyerId: conversation.buyer_id,
    sellerId: conversation.seller_id,
    productId: conversation.listing_id,
    listingId: conversation.listing_id,
    createdAt: conversation.created_at,
    updatedAt: conversation.last_message_at,
    lastMessageAt: conversation.last_message_at,
    unreadCount,
    counterpart: {
      id: counterpartId,
      name: buildParticipantLabel(p, isBuyer ? 'Seller' : 'Buyer'),
      subtitle: isBuyer ? 'Seller' : 'Buyer',
      avatarUrl: p?.store_logo_url ?? null,
    },
    product: prod
      ? {
          id: prod.id,
          name: prod.name,
          imageUrl: prod.images?.[0] ?? null,
          price: prod.price,
        }
      : null,
    lastMessage: lastRow
      ? {
          id: lastRow.id,
          body: lastRow.body,
          createdAt: lastRow.created_at,
          senderId: lastRow.sender_id,
          senderType: lastRow.sender_type,
          readAt: lastRow.read_at,
        }
      : null,
  }
}

export async function getMessagesPageForUser(
  userId: string,
  conversationId: string,
  opts?: { cursor?: string | null; limit?: number }
): Promise<{ messages: ConversationMessage[]; nextCursor: string | null } | null> {
  const conversation = await getConversationRowForUser(userId, conversationId)
  if (!conversation) {
    return null
  }

  const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_PAGE, 1), 100)
  const offset = decodeConversationListCursor(opts?.cursor ?? null)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, sender_type, body, attachments, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    logger.error('Failed to paginate messages', { conversationId, message: error.message })
    return null
  }

  const rows = (data as MessageRow[] | null) ?? []
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const next = hasMore ? encodeConversationListCursor(offset + limit) : null

  return { messages: page.map(mapMessage).reverse(), nextCursor: next }
}

export async function getOrCreateConversationForBuyer(input: {
  buyerId: string
  sellerId: string
  listingId?: string | null
}): Promise<{ conversationId: string } | { error: string }> {
  const { buyerId, sellerId, listingId } = input
  if (buyerId === sellerId) {
    return { error: 'You cannot message your own listing.' }
  }

  const { supabase, admin } = await getClients()

  const { data: vendorRow } = await admin.from('vendors').select('id').eq('id', sellerId).maybeSingle()
  if (!vendorRow) {
    return { error: 'That seller is not available right now.' }
  }

  if (listingId) {
    const { data: product, error } = await admin
      .from('products')
      .select('id, vendor_id, is_active, approval_status')
      .eq('id', listingId)
      .maybeSingle()

    if (error || !product) {
      return { error: 'That listing is no longer available.' }
    }

    const productRow = product as ProductRow
    if (
      productRow.vendor_id !== sellerId ||
      productRow.is_active === false ||
      productRow.approval_status === 'rejected'
    ) {
      return { error: 'That listing is no longer available.' }
    }
  }

  let existingQuery = supabase
    .from('conversations')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)

  existingQuery = listingId ? existingQuery.eq('listing_id', listingId) : existingQuery.is('listing_id', null)

  const { data: existing } = await existingQuery.maybeSingle()
  if (existing?.id) {
    return { conversationId: existing.id as string }
  }

  const { data: created, error: insertError } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId ?? null,
    })
    .select('id')
    .single()

  if (!insertError && created?.id) {
    return { conversationId: created.id as string }
  }

  if (insertError?.code === '23505') {
    const { data: race } = await existingQuery.maybeSingle()
    if (race?.id) {
      return { conversationId: race.id as string }
    }
  }

  logger.error('Failed to create conversation', {
    buyerId,
    sellerId,
    listingId: listingId ?? null,
    message: insertError?.message ?? 'Unknown error',
    code: insertError?.code ?? null,
  })
  return { error: 'Failed to start the conversation. Please try again.' }
}

export type SendMessageResult =
  | { ok: true; message: ConversationMessage }
  | { ok: false; code: 'OFF_PLATFORM_BLOCKED'; message: string }
  | { ok: false; code: 'NOT_FOUND' | 'VALIDATION' | 'UNKNOWN'; message: string }

export async function sendConversationMessageForUser(input: {
  userId: string
  conversationId: string
  body: string
  attachments?: MessageAttachment[]
}): Promise<SendMessageResult> {
  const attachments = input.attachments ?? []
  const body = input.body.trim()
  if (!body && attachments.length === 0) {
    return { ok: false, code: 'VALIDATION', message: 'Message cannot be empty.' }
  }

  const conversation = await getConversationRowForUser(input.userId, input.conversationId)
  if (!conversation) {
    return { ok: false, code: 'NOT_FOUND', message: 'Conversation not found.' }
  }

  const senderType: 'buyer' | 'seller' =
    conversation.buyer_id === input.userId ? 'buyer' : 'seller'

  const attachmentUrls = attachments.map((a) => a.url).filter(Boolean)
  const scanPayload = [body, ...attachmentUrls].join('\n')
  const violation = detectOffPlatformContent(scanPayload, attachmentUrls)
  if (violation) {
    await recordPolicyViolation({
      userId: input.userId,
      matchedPattern: violation.pattern,
      rawMessage: scanPayload,
    })
    return {
      ok: false,
      code: 'OFF_PLATFORM_BLOCKED',
      message: OFF_PLATFORM_USER_MESSAGE,
    }
  }

  const supabase = await createClient()
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.userId,
      sender_type: senderType,
      body,
      attachments,
    })
    .select('id, conversation_id, sender_id, sender_type, body, attachments, created_at, read_at')
    .single()

  if (error || !message) {
    logger.error('Failed to send message', {
      userId: input.userId,
      conversationId: input.conversationId,
      message: error?.message ?? 'Unknown error',
      code: error?.code ?? null,
    })
    return { ok: false, code: 'UNKNOWN', message: 'Failed to send message.' }
  }

  const mapped = mapMessage(message as MessageRow)

  if (senderType === 'buyer') {
    const admin = getAdminClient()
    let buyerFirstName = 'A buyer'
    let resolvedTitle = 'your listing'

    if (admin) {
      const { data: buyer } = await admin
        .from('users')
        .select('full_name')
        .eq('id', input.userId)
        .maybeSingle()
      const name = buyer && typeof (buyer as { full_name?: string }).full_name === 'string'
        ? (buyer as { full_name: string }).full_name
        : ''
      if (name.trim()) {
        buyerFirstName = name.trim().split(/\s+/)[0] ?? buyerFirstName
      }

      if (conversation.listing_id) {
        const { data: productRow } = await admin
          .from('products')
          .select('name')
          .eq('id', conversation.listing_id)
          .maybeSingle()
        if (productRow && typeof (productRow as { name?: string }).name === 'string') {
          resolvedTitle = (productRow as { name: string }).name
        }
      }
    }

    void notifySellerOfBuyerMessage({
      sellerUserId: conversation.seller_id,
      buyerFirstName,
      listingTitle: resolvedTitle,
      messagePreview: body || '(attachment)',
      conversationPath: `/messages/${input.conversationId}`,
    })
  }

  return { ok: true, message: mapped }
}

export async function flagMessageForUser(input: {
  userId: string
  messageId: string
  reason: 'spam' | 'abuse' | 'off_platform_payment' | 'fraud'
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .eq('id', input.messageId)
    .maybeSingle()

  if (msgError || !message) {
    return { ok: false, message: 'Message not found.' }
  }

  const conversation = await getConversationRowForUser(input.userId, message.conversation_id as string)
  if (!conversation) {
    return { ok: false, message: 'Message not found.' }
  }

  const { error } = await supabase.from('message_flags').insert({
    message_id: input.messageId,
    flagged_by: input.userId,
    reason: input.reason,
  })

  if (error) {
    logger.error('Failed to flag message', { message: error.message })
    return { ok: false, message: 'Could not submit flag.' }
  }

  return { ok: true }
}
