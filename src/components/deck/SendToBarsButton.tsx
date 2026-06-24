'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { sendDeckCardToBars } from '@/actions/send-deck-card-to-bars'
import { DECK_FONTS, LIMINAL } from '@/lib/allyship-deck/card-visuals'
import type { CardSubject } from './AllyshipCard'

/**
 * The card's one move: Send to BARS — capture the card as a ready-to-practice BAR.
 *
 * - Logged in → the BAR lands in the Hand; we route to NOW home (`/`).
 * - Logged out → no dead end: the intent is captured server-side and we route to
 *   MGA signup; the BAR is materialized after the account is created.
 * - Genuine failures → inline message (never "Not logged in").
 */
export function SendToBarsButton({ cardId, subject, label = 'Send to BARS →' }: { cardId: string; subject: CardSubject; label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const send = () => {
    setError(null)
    startTransition(async () => {
      const res = await sendDeckCardToBars({ cardId, subject })
      if ('needsAuth' in res) {
        router.push('/signup?returnTo=/deck')
      } else if ('error' in res) {
        setError(res.error)
      } else {
        router.push('/')
      }
    })
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button type="button" onClick={send} disabled={pending} style={{ ...btn, opacity: pending ? 0.6 : 1 }}>
        {pending ? 'Sending…' : label}
      </button>
      {error && (
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 12.5, color: '#f0a0a0', margin: '8px 0 0', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  )
}

const btn: CSSProperties = {
  display: 'block',
  width: '100%',
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 15,
  color: '#fff',
  background: LIMINAL.frame,
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 10px 24px -10px ${LIMINAL.frame}`,
}
