'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'

type StartConversationButtonProps = {
  sellerId: string | null | undefined
  productId?: string | null
  className?: string
  label?: string
}

export default function StartConversationButton({
  sellerId,
  productId = null,
  className,
  label = 'Message seller',
}: StartConversationButtonProps) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async () => {
    if (!sellerId) {
      toast.error('Seller unavailable right now.')
      return
    }

    if (loading) {
      return
    }

    if (!user) {
      const params = new URLSearchParams()
      params.set('mode', 'signin')
      params.set('redirect', pathname)
      router.push(`/auth?${params.toString()}`)
      return
    }

    if (user.id === sellerId) {
      router.push('/seller')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId,
          listingId: productId ?? null,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        conversationId?: string
      }

      if (!response.ok || !payload.conversationId) {
        throw new Error(payload.error || 'Failed to start conversation.')
      }

      router.push(`/messages/${payload.conversationId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start conversation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting || loading}
      className={className}
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
      {label}
    </button>
  )
}
