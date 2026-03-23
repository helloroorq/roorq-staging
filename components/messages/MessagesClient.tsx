'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Loader2, MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatINR } from '@/lib/utils/currency'
import type { ConversationMessage, ConversationPreview } from '@/lib/messages/types'

type MessagesClientProps = {
  currentUserId: string
  initialConversations: ConversationPreview[]
  initialConversationId: string | null
  initialMessages: ConversationMessage[]
}

const timestampLabel = (value: string | null) => {
  if (!value) {
    return 'Just now'
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

const moveConversationToTop = (
  conversations: ConversationPreview[],
  conversationId: string,
  update: (conversation: ConversationPreview) => ConversationPreview
) => {
  const nextConversations = conversations.map((conversation) =>
    conversation.id === conversationId ? update(conversation) : conversation
  )
  const activeConversation = nextConversations.find((conversation) => conversation.id === conversationId)
  const otherConversations = nextConversations.filter((conversation) => conversation.id !== conversationId)

  return activeConversation ? [activeConversation, ...otherConversations] : nextConversations
}

export default function MessagesClient({
  currentUserId,
  initialConversations,
  initialConversationId,
  initialMessages,
}: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId)
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ConversationMessage[]>>(
    initialConversationId ? { [initialConversationId]: initialMessages } : {}
  )
  const [draft, setDraft] = useState('')
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const requestedConversationId = searchParams?.get('conversation')
    if (!requestedConversationId || requestedConversationId === activeConversationId) {
      return
    }

    if (conversations.some((conversation) => conversation.id === requestedConversationId)) {
      setActiveConversationId(requestedConversationId)
    }
  }, [activeConversationId, conversations, searchParams])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  )

  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : []

  const loadMessages = async (conversationId: string) => {
    setLoadingConversationId(conversationId)

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        cache: 'no-store',
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        messages?: ConversationMessage[]
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load messages.')
      }

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: payload.messages ?? [],
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load messages.')
    } finally {
      setLoadingConversationId(null)
    }
  }

  const handleSelectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('conversation', conversationId)
    router.replace(`/messages?${params.toString()}`)

    if (!messagesByConversation[conversationId]) {
      await loadMessages(conversationId)
    }
  }

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activeConversationId || !draft.trim()) {
      return
    }

    setIsSending(true)

    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: draft.trim(),
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: ConversationMessage
      }

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || 'Failed to send message.')
      }

      setMessagesByConversation((current) => ({
        ...current,
        [activeConversationId]: [...(current[activeConversationId] ?? []), payload.message as ConversationMessage],
      }))

      setConversations((current) =>
        moveConversationToTop(current, activeConversationId, (conversation) => ({
          ...conversation,
          lastMessageAt: payload.message?.createdAt ?? conversation.lastMessageAt,
          lastMessage: {
            id: payload.message?.id ?? conversation.lastMessage?.id ?? activeConversationId,
            body: payload.message?.body ?? conversation.lastMessage?.body ?? '',
            createdAt: payload.message?.createdAt ?? conversation.lastMessage?.createdAt ?? new Date().toISOString(),
            senderId: payload.message?.senderId ?? currentUserId,
            readAt: payload.message?.readAt ?? null,
          },
        }))
      )

      setDraft('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message.')
    } finally {
      setIsSending(false)
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-[32px] border border-dashed border-stone-300 bg-white px-6 py-16 text-center shadow-[0_24px_50px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.05em] text-slate-950">No conversations yet</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
          Start from a product page or storefront to message a seller and keep all negotiation or sizing questions in one place.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Browse listings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
        <div className="border-b border-stone-100 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Inbox</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Buyer and seller chat</h2>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void handleSelectConversation(conversation.id)}
                className={`flex w-full items-start gap-4 border-b border-stone-100 px-5 py-4 text-left transition ${
                  isActive ? 'bg-stone-50' : 'hover:bg-stone-50/70'
                }`}
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-[20px] bg-stone-100">
                  {conversation.product?.imageUrl ? (
                    <Image
                      src={conversation.product.imageUrl}
                      alt={conversation.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{conversation.counterpart.name}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                        {conversation.counterpart.subtitle}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-stone-400">
                      {timestampLabel(conversation.lastMessageAt)}
                    </span>
                  </div>

                  {conversation.product && (
                    <p className="mt-2 truncate text-xs font-medium text-slate-600">
                      {conversation.product.name}
                      {conversation.product.price !== null ? ` • ${formatINR(conversation.product.price)}` : ''}
                    </p>
                  )}

                  <p className="mt-2 truncate text-sm text-stone-500">
                    {conversation.lastMessage?.body || 'Conversation started'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
        {activeConversation ? (
          <>
            <div className="border-b border-stone-100 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                    {activeConversation.counterpart.subtitle}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">
                    {activeConversation.counterpart.name}
                  </h2>
                </div>
                {activeConversation.product && (
                  <Link
                    href={`/products/${activeConversation.product.id}`}
                    className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-300 hover:bg-white"
                  >
                    View listing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {activeConversation.product && (
                <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-stone-100 bg-stone-50/80 px-4 py-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-stone-100">
                    {activeConversation.product.imageUrl && (
                      <Image
                        src={activeConversation.product.imageUrl}
                        alt={activeConversation.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{activeConversation.product.name}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {activeConversation.product.price !== null
                        ? formatINR(activeConversation.product.price)
                        : 'Price unavailable'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#faf8f3] px-6 py-6">
              {loadingConversationId === activeConversation.id && !messagesByConversation[activeConversation.id] ? (
                <div className="flex h-full items-center justify-center text-stone-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : activeMessages.length > 0 ? (
                activeMessages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                          isOwnMessage
                            ? 'bg-slate-950 text-white'
                            : 'border border-stone-200 bg-white text-slate-900'
                        }`}
                      >
                        <p className="text-sm leading-6">{message.body}</p>
                        <p
                          className={`mt-2 text-[11px] ${
                            isOwnMessage ? 'text-white/60' : 'text-stone-400'
                          }`}
                        >
                          {timestampLabel(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">No messages yet</p>
                    <p className="mt-2 text-sm text-stone-500">
                      Start the conversation with sizing, condition, or delivery questions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-stone-100 bg-white px-6 py-5">
              <div className="flex items-end gap-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about condition, fit, delivery, or bundle options"
                  rows={3}
                  className="min-h-[88px] flex-1 resize-none rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !draft.trim()}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </div>
  )
}
