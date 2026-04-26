'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { formatINR } from '@/lib/utils/currency'
import type { ConversationPreview } from '@/lib/messages/types'

const timestampLabel = (value: string | null) => {
  if (!value) {
    return 'Just now'
  }
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

export default function MessagesInbox({ conversations }: { conversations: ConversationPreview[] }) {
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
    <div className="overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.05)]">
      <div className="border-b border-stone-100 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Inbox</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Buyer and seller chat</h2>
      </div>
      <ul className="max-h-[75vh] divide-y divide-stone-100 overflow-y-auto">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <Link
              href={`/messages/${conversation.id}`}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-stone-50/80"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[20px] bg-stone-100">
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-[11px] text-stone-400">
                      {timestampLabel(conversation.lastMessageAt)}
                    </span>
                    {(conversation.unreadCount ?? 0) > 0 ? (
                      <span className="inline-flex min-w-6 justify-center rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white">
                        {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
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
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
