'use client'

/**
 * RequestButton — the consent-forward "Ask {owner} for this" CTA on a shared
 * Promise Move. With a real share token it records a PromiseRequest; in demo
 * mode (no token) it's a non-recording preview button.
 */

import { useState, type CSSProperties } from 'react'
import { requestPromiseMove } from '@/actions/promise-move'

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

const ctaStyle: CSSProperties = {
  width: '100%', padding: 15, border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer',
  background: 'var(--bars-liminal)', color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14,
  boxShadow: '0 0 26px -7px var(--bars-liminal-glow), inset 0 1px 0 rgba(255,255,255,0.18)',
}

export default function RequestButton({ owner, token }: { owner: string; token: string | null }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function ask() {
    if (!token) {
      setMessage('This is a preview — publish a move to make it requestable.')
      return
    }
    if (state === 'sending' || state === 'sent') return
    setState('sending')
    try {
      const res = await requestPromiseMove(token, {})
      if ('error' in res) {
        setState('error')
        setMessage(res.error)
      } else {
        setState('sent')
      }
    } catch {
      setState('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ width: '100%', padding: 14, borderRadius: 'var(--bars-radius-md)', background: 'color-mix(in srgb, var(--bars-wood-frame) 13%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-wood-frame) 45%, var(--bars-line))', textAlign: 'center' }}>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13.5, color: 'var(--bars-wood-gem)', margin: 0 }}>Request sent ✓</p>
        <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.4, color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>
          {owner} will be asked for consent before anything happens.
        </p>
      </div>
    )
  }

  return (
    <>
      <button onClick={ask} disabled={state === 'sending'} style={{ ...ctaStyle, opacity: state === 'sending' ? 0.6 : 1 }}>
        {state === 'sending' ? 'Sending…' : `Ask ${owner} for this →`}
      </button>
      <p style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: message ? 'var(--bars-fire-gem)' : 'var(--bars-text-muted)', textAlign: 'center', margin: '10px 0 0' }}>
        {message || "You'll be asked for consent before anything happens"}
      </p>
    </>
  )
}
