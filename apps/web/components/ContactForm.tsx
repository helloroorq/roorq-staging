'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import toast from 'react-hot-toast'
import { publicEnv } from '@/lib/env.public'

type ContactFormState = {
  name: string
  email: string
  message: string
}

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void
    turnstile?: { reset: (widgetId?: string) => void }
  }
}

const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function ContactForm() {
  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    message: '',
  })
  const [captchaToken, setCaptchaToken] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setCaptchaToken(token)
      setError(null)
    }

    return () => {
      delete window.onTurnstileSuccess
    }
  }, [])

  const updateField = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!siteKey) {
      setError('Captcha is not configured. Please try again later.')
      return
    }

    if (!captchaToken) {
      setError('Please complete the captcha before sending.')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          message: form.message.trim(),
          captchaToken,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send message.')
      }

      toast.success('Message sent. We will get back to you shortly.')
      setForm({ name: '', email: '', message: '' })
      setCaptchaToken('')
      window.turnstile?.reset()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message.'
      setError(message)
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      )}

      <div>
        <label className="block text-sm font-bold uppercase mb-2">Name</label>
        <input
          type="text"
          required
          maxLength={120}
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full border border-gray-300 p-3 focus:border-black outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-bold uppercase mb-2">Email</label>
        <input
          type="email"
          required
          maxLength={160}
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          className="w-full border border-gray-300 p-3 focus:border-black outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-bold uppercase mb-2">Message</label>
        <textarea
          rows={5}
          required
          maxLength={2000}
          value={form.message}
          onChange={(e) => updateField('message', e.target.value)}
          className="w-full border border-gray-300 p-3 focus:border-black outline-none"
        />
      </div>

      {siteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-callback="onTurnstileSuccess"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSending}
        className="bg-black text-white px-8 py-3 uppercase font-black tracking-widest hover:bg-gray-800 w-full disabled:opacity-60"
      >
        {isSending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
