'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import type { ConversationPreview } from '@/lib/messages/types'

type UnreadPayload = {
  unreadTotal: number
  unreadConversations: ConversationPreview[]
}

export default function MessagesNotificationBell() {
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<UnreadPayload | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const response = await fetch('/api/conversations/unread', { cache: 'no-store' })
      if (response.ok) {
        setPayload((await response.json()) as UnreadPayload)
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!user) {
      setPayload(null)
      return
    }
    void load()
  }, [user, pathname])

  useEffect(() => {
    if (!user) {
      return
    }
    const id = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(id)
  }, [user])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (!user) {
    return null
  }

  const total = payload?.unreadTotal ?? 0
  const previews = payload?.unreadConversations ?? []

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          void load()
        }}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-black md:h-11 md:w-11"
        aria-label="Message notifications"
      >
        <Bell className="h-5 w-5" />
        {total > 0 ? (
          <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-neutral-200 bg-white py-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Unread messages</p>
            {total === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">You&apos;re all caught up.</p>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">
                {total} unread {total === 1 ? 'conversation' : 'conversations'}
              </p>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {previews.length === 0 ? (
              <li className="px-4 py-3 text-sm text-neutral-500">No unread threads in recent activity.</li>
            ) : (
              previews.map((c) => (
                <li key={c.id} className="border-b border-neutral-50 last:border-0">
                  <Link
                    href={`/messages/${c.id}`}
                    className="block px-4 py-3 transition hover:bg-neutral-50"
                    onClick={() => setOpen(false)}
                  >
                    <p className="truncate text-sm font-semibold text-neutral-900">{c.counterpart.name}</p>
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {c.lastMessage?.body || 'New message'}
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-400">
                      {c.lastMessageAt
                        ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })
                        : ''}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-neutral-100 px-2 py-2">
            <Link
              href="/messages"
              className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-black hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              Open inbox
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
