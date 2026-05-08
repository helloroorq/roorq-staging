'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, Check, Copy, Instagram, MessageCircle, Share2 } from 'lucide-react'

type Props = {
  dropAtUtc: string
  initialCount: number
  referrerCode: string | null
}

type SignupResponse = {
  success?: boolean
  alreadyJoined?: boolean
  referralCode?: string
  error?: string
}

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean }

function diff(target: number): Remaining {
  const ms = Math.max(0, target - Date.now())
  const total = Math.floor(ms / 1000)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: ms === 0,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function Drop001Client({ dropAtUtc, initialCount, referrerCode }: Props) {
  const dropTime = useMemo(() => new Date(dropAtUtc).getTime(), [dropAtUtc])
  const [remaining, setRemaining] = useState<Remaining>(() => diff(dropTime))
  const [count, setCount] = useState(initialCount)
  const [submitted, setSubmitted] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', phone: '', instagram: '', iitrRoll: '' })
  const successRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = setInterval(() => setRemaining(diff(dropTime)), 1000)
    return () => clearInterval(id)
  }, [dropTime])

  useEffect(() => {
    if (submitted && successRef.current) {
      successRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [submitted])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          instagram: form.instagram.trim() || undefined,
          iitrRoll: form.iitrRoll.trim() || undefined,
          referrerCode: referrerCode ?? undefined,
          source: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
        }),
      })

      const data = (await response.json()) as SignupResponse

      if (!response.ok || !data.success || !data.referralCode) {
        toast.error(data.error || 'Could not join. Try again.')
        return
      }

      setCode(data.referralCode)
      setAlreadyJoined(Boolean(data.alreadyJoined))
      setSubmitted(true)
      if (!data.alreadyJoined) setCount((prev) => prev + 1)
    } catch (cause) {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const shareUrl = useMemo(() => {
    if (!code) return ''
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.roorq.com'
    return `${base}/drop-001?ref=${code}`
  }, [code])

  const shareText = useMemo(
    () =>
      `ROORQ Drop 001 lands May 13. ~30 hand-picked pieces, IITR-first. I locked my slot — here's yours: ${shareUrl}`,
    [shareUrl]
  )

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Could not copy. Long-press to copy.'))
  }

  function nativeShare() {
    if (typeof navigator === 'undefined' || !navigator.share) {
      copyShareLink()
      return
    }
    navigator
      .share({ title: 'ROORQ Drop 001', text: shareText, url: shareUrl })
      .catch(() => {})
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--rq-bg))] text-[rgb(var(--rq-ink))]">
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        {/* HERO CARD */}
        <section className="relative overflow-hidden rounded-3xl bg-[rgb(var(--rq-surface))] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]">
          <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--rq-brand))] px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              IITR FIRST · MAY 13
            </span>
          </div>

          <div className="px-5 pb-8 pt-20 sm:px-10 sm:pb-12 sm:pt-24 md:px-14 md:pb-14 md:pt-28">
            <h1
              className="text-[2.6rem] leading-[0.9] tracking-[-0.04em] sm:text-[3.6rem] md:text-[5rem] lg:text-[6.5rem]"
              style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
            >
              <span className="block">PIECES YOUR</span>
              <span className="block">BATCHMATES</span>
              <span className="block text-[rgb(var(--rq-brand))]">WON&apos;T HAVE.</span>
            </h1>

            <p className="mt-5 max-w-[560px] text-[14px] leading-[1.65] text-[rgb(var(--rq-ink-muted))] sm:text-[15.5px]">
              Drop 001 lands <strong className="text-[rgb(var(--rq-ink))]">8 PM IST, May 13</strong>.
              ~30 hand-picked pieces. Story-scored. IITR rolls get a 30-minute head start before
              campus opens. After that, it&apos;s first-come.
            </p>

            {/* COUNTDOWN */}
            {!remaining.done ? (
              <div className="mt-7 grid max-w-[520px] grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'days', value: remaining.days },
                  { label: 'hrs', value: remaining.hours },
                  { label: 'min', value: remaining.minutes },
                  { label: 'sec', value: remaining.seconds },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="rounded-2xl border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-bg))] px-2 py-3 text-center sm:py-4"
                  >
                    <div
                      className="text-[1.9rem] leading-none tracking-tight tabular-nums sm:text-[2.4rem]"
                      style={{ fontFamily: 'var(--font-anton), Arial Narrow, sans-serif' }}
                    >
                      {pad(cell.value)}
                    </div>
                    <div className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--rq-ink-muted))]">
                      {cell.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[rgb(var(--rq-brand))] px-5 py-2.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Drop is live
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-[rgb(var(--rq-ink-muted))]">
              <div className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--rq-success))]" />
                <span className="tabular-nums">
                  <strong className="text-[rgb(var(--rq-ink))]">{count}</strong> already in
                </span>
              </div>
              {referrerCode ? (
                <div className="inline-flex items-center gap-1.5">
                  <span>Invited via</span>
                  <code className="rounded bg-[rgb(var(--rq-accent))] px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-[rgb(var(--rq-ink))]">
                    {referrerCode}
                  </code>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* FORM / SUCCESS */}
        <section
          ref={successRef}
          className="mt-6 rounded-3xl border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-surface))] p-5 sm:p-8 md:p-10"
        >
          {!submitted ? (
            <>
              <h2 className="text-xl font-black uppercase tracking-[-0.01em] sm:text-2xl">
                Lock your slot
              </h2>
              <p className="mt-1.5 text-[13.5px] text-[rgb(var(--rq-ink-muted))] sm:text-sm">
                Drop us your email. We&apos;ll send the priority link 30 minutes before the drop.
                Phone + IITR roll are optional but unlock the head start.
              </p>

              <form className="mt-5 space-y-3.5" onSubmit={onSubmit} noValidate>
                <Field
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                  placeholder="you@iitr.ac.in"
                />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field
                    label="Phone (WhatsApp)"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                    placeholder="+91 90000 00000"
                  />
                  <Field
                    label="Instagram"
                    value={form.instagram}
                    onChange={(value) => setForm((prev) => ({ ...prev, instagram: value }))}
                    placeholder="@yourhandle"
                  />
                </div>
                <Field
                  label="IITR roll number — for 30-min head start"
                  inputMode="numeric"
                  value={form.iitrRoll}
                  onChange={(value) => setForm((prev) => ({ ...prev, iitrRoll: value }))}
                  placeholder="e.g. 22115001"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--rq-brand))] text-sm font-bold uppercase tracking-[0.05em] text-white transition duration-150 hover:opacity-90 disabled:opacity-60 sm:h-14 sm:text-base"
                >
                  {submitting ? 'Locking…' : 'Lock my slot'}
                  <ArrowRight className="h-4 w-4 transition duration-150 group-hover:translate-x-0.5" />
                </button>
                <p className="text-center text-[11px] leading-relaxed text-[rgb(var(--rq-ink-muted))]">
                  No spam. One email before the drop, one when it&apos;s live.
                </p>
              </form>
            </>
          ) : (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--rq-success))]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[rgb(var(--rq-success))]">
                <Check className="h-3.5 w-3.5" />
                {alreadyJoined ? 'Already in' : "You're in"}
              </div>

              <div>
                <h2 className="text-xl font-black uppercase tracking-[-0.01em] sm:text-2xl">
                  Now bring two friends.
                </h2>
                <p className="mt-1.5 text-[13.5px] text-[rgb(var(--rq-ink-muted))] sm:text-sm">
                  Each friend who joins via your link bumps you up the priority queue. Two = your
                  slot opens 7:30 PM IST. The link is yours forever.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-bg))] p-4 sm:p-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--rq-ink-muted))]">
                  Your share link
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <code className="flex-1 truncate text-[13px] font-medium text-[rgb(var(--rq-ink))] sm:text-sm">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    aria-label="Copy share link"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--rq-ink))] text-white transition hover:opacity-90"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-[rgb(var(--rq-ink))] text-sm font-bold text-white transition hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-surface))] text-sm font-bold text-[rgb(var(--rq-ink))] transition hover:bg-[rgb(var(--rq-bg))]"
                >
                  <Instagram className="h-4 w-4" />
                  Copy for IG
                </button>
                <button
                  type="button"
                  onClick={nativeShare}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-surface))] text-sm font-bold text-[rgb(var(--rq-ink))] transition hover:bg-[rgb(var(--rq-bg))]"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          )}
        </section>

        {/* WHAT YOU GET */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: '30-min head start',
              body: 'IITR rolls open at 7:30 PM IST May 13. Campus opens at 8:00 PM. The good pieces won\'t survive the gap.',
            },
            {
              title: 'Story Score',
              body: 'Every piece is graded on history, condition, and rarity. You see the score, you decide the price.',
            },
            {
              title: 'COD on campus',
              body: 'Pay online or COD. Hand-delivered inside campus. Returns inside 7 days, no questions.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-surface))] p-5"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--rq-brand))]">
                {card.title}
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-[rgb(var(--rq-ink-muted))]">
                {card.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  autoComplete?: string
  inputMode?: 'email' | 'tel' | 'numeric' | 'text'
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  autoComplete,
  inputMode,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--rq-ink-muted))]">
        {label}
        {required ? <span className="ml-1 text-[rgb(var(--rq-brand))]">*</span> : null}
      </span>
      <input
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 block h-12 w-full rounded-xl border border-[rgb(var(--rq-line))] bg-[rgb(var(--rq-bg))] px-4 text-[15px] text-[rgb(var(--rq-ink))] outline-none transition focus:border-[rgb(var(--rq-ink))] focus:bg-[rgb(var(--rq-surface))]"
      />
    </label>
  )
}
