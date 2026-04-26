'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Flag, Loader2, Paperclip, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatINR } from '@/lib/utils/currency'
import type { ConversationMessage, ConversationPreview, MessageAttachment } from '@/lib/messages/types'

const timestampLabel = (value: string | null) => {
  if (!value) {
    return 'Just now'
  }
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

type ConversationThreadClientProps = {
  currentUserId: string
  conversationId: string
  initialConversation: ConversationPreview
  initialMessages: ConversationMessage[]
}

export default function ConversationThreadClient({
  currentUserId,
  conversationId,
  initialConversation,
  initialMessages,
}: ConversationThreadClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [isSending, setIsSending] = useState(false)
  const [flaggingId, setFlaggingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const mergePolled = useCallback((incoming: ConversationMessage[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      const merged = [...prev]
      for (const m of incoming) {
        if (!seen.has(m.id)) {
          merged.push(m)
          seen.add(m.id)
        }
      }
      merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return merged
    })
  }, [])

  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages?limit=50`, {
          cache: 'no-store',
        })
        const payload = (await response.json().catch(() => ({}))) as { messages?: ConversationMessage[] }
        if (response.ok && payload.messages?.length) {
          mergePolled(payload.messages)
        }
      } catch {
        /* ignore poll errors */
      }
    }, 15_000)
    return () => window.clearInterval(id)
  }, [conversationId, mergePolled])

  const handleAttach = async (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    const next: MessageAttachment[] = [...attachments]

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only images are supported.')
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be 5MB or smaller.')
        continue
      }

      try {
        const presignResponse = await fetch(`/api/conversations/${conversationId}/presign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          }),
        })
        const presignPayload = (await presignResponse.json().catch(() => ({}))) as {
          error?: string
          uploadUrl?: string
          publicUrl?: string
        }

        if (!presignResponse.ok || !presignPayload.uploadUrl || !presignPayload.publicUrl) {
          toast.error(presignPayload.error || 'Could not start upload. Is R2 configured?')
          continue
        }

        const put = await fetch(presignPayload.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!put.ok) {
          toast.error('Upload failed.')
          continue
        }

        next.push({
          url: presignPayload.publicUrl,
          mime: file.type,
          size: file.size,
        })
      } catch {
        toast.error('Upload failed.')
      }
    }

    setAttachments(next)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim() && attachments.length === 0) {
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: draft.trim(),
          attachments,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        code?: string
        message?: ConversationMessage
      }

      if (!response.ok) {
        if (payload.code === 'OFF_PLATFORM_BLOCKED') {
          toast.error(payload.error ?? 'Message blocked.')
        } else {
          toast.error(payload.error || 'Failed to send message.')
        }
        return
      }

      if (payload.message) {
        setMessages((m) => [...m, payload.message as ConversationMessage])
        setDraft('')
        setAttachments([])
        router.refresh()
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleFlag = async (messageId: string) => {
    setFlaggingId(messageId)
    try {
      const response = await fetch(`/api/messages/${messageId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'spam' }),
      })
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Flag failed')
      }
      toast.success('Thanks — our team will review.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Flag failed')
    } finally {
      setFlaggingId(null)
    }
  }

  const product = initialConversation.product

  const title = useMemo(() => initialConversation.counterpart.name, [initialConversation.counterpart.name])

  return (
    <div className="flex min-h-[75vh] flex-col overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
      <div className="border-b border-stone-100 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
              {initialConversation.counterpart.subtitle}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{title}</h2>
          </div>
          {product ? (
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-stone-300 hover:bg-white"
            >
              View listing
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {product ? (
          <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-stone-100 bg-stone-50/80 px-4 py-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-stone-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {product.price !== null ? formatINR(product.price) : 'Price unavailable'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#faf8f3] px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-semibold text-slate-950">No messages yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Start the conversation with sizing, condition, or delivery questions.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                    isOwn ? 'bg-slate-950 text-white' : 'border border-stone-200 bg-white text-slate-900'
                  }`}
                >
                  {message.attachments?.length ? (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((a) => (
                        <a
                          key={a.url}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.url} alt="" className="max-h-48 max-w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {message.body.trim() ? (
                    <p className="text-sm leading-6">{message.body}</p>
                  ) : null}
                  <div
                    className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${
                      isOwn ? 'text-white/60' : 'text-stone-400'
                    }`}
                  >
                    <span>{timestampLabel(message.createdAt)}</span>
                    {!isOwn ? (
                      <button
                        type="button"
                        onClick={() => void handleFlag(message.id)}
                        disabled={flaggingId === message.id}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      >
                        {flaggingId === message.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Flag className="h-3 w-3" />
                        )}
                        Flag
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-stone-100 bg-white px-6 py-5">
        {attachments.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <span
                key={a.url}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
              >
                Image
              </span>
            ))}
            <button
              type="button"
              className="text-xs font-semibold text-rose-600"
              onClick={() => setAttachments([])}
            >
              Clear
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleAttach(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-white"
            aria-label="Attach image"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about condition, fit, delivery, or bundle options"
            rows={3}
            className="min-h-[88px] flex-1 resize-none rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-stone-400 focus:border-stone-300 focus:bg-white"
          />
          <button
            type="submit"
            disabled={isSending || (!draft.trim() && attachments.length === 0)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
