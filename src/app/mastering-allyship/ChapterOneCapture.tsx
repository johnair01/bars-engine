'use client'

/**
 * ChapterOneCapture — the soft email fallback on the MTGOA sales page.
 * "Not ready? Send me Chapter One →" — posts to the shared /api/awaken/signup
 * (intent: chapter, source: mastering-allyship) so the lead is segmented to this
 * funnel and receives the Chapter One email. No auth. UI_COVENANT: --bars-* tokens,
 * layout only in Tailwind/inline.
 */
import { useState, type CSSProperties } from 'react'

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ChapterOneCapture() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email.')
      return
    }
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/awaken/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'chapter', email: email.trim(), source: 'mastering-allyship' }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) setState('done')
      else {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="mtgoa-card flex items-center gap-3 p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-[16px]" style={{ ...MONO, background: 'var(--mr-gold-soft)', color: 'var(--mr-gold, #e0a92a)' }}>
          ♦
        </span>
        <p style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[14px]">
          On its way. Check your inbox for Chapter One — and I’ll tell you when the physical run ships.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mtgoa-card flex flex-col gap-3 p-5">
      <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[15px] font-semibold">
        Not ready? Send me Chapter One →
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Your email"
          className="min-h-[44px] flex-1 rounded-[10px] px-3.5 text-[14px]"
          style={{
            ...BODY,
            background: 'var(--bars-bg-base)',
            color: 'var(--bars-text-primary)',
            border: '1px solid var(--bars-line-strong)',
          }}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="mr-gold-btn min-h-[44px] px-5 py-3 text-[14px] font-bold disabled:opacity-60"
          style={DISPLAY}
        >
          {state === 'sending' ? 'Sending…' : 'Send it'}
        </button>
      </div>
      {error && (
        <p style={{ ...BODY, color: 'var(--mtgoa-coral)' }} className="text-[12px]">
          {error}
        </p>
      )}
      <p style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9.5px] uppercase tracking-[0.16em]">
        No spam · one list, real updates
      </p>
    </form>
  )
}
