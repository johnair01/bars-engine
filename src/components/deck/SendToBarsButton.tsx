'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { sendDeckCardToBars } from '@/actions/send-deck-card-to-bars'
import { DECK_FONTS, LIMINAL } from '@/lib/allyship-deck/card-visuals'
import type { CardSubject } from './AllyshipCard'

/**
 * The card's one move: Send to BARS. Seeds a private quest from the card (provenance
 * stamped server-side) and routes the player to `/bars/{id}` — where the BAR flow lives
 * (capture charge / 3·2·1 happen on the bloomed quest, not the seed).
 */
export function SendToBarsButton({ cardId, subject }: { cardId: string; subject: CardSubject }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const send = () => {
    setError(null)
    startTransition(async () => {
      const res = await sendDeckCardToBars({ cardId, subject })
      if ('error' in res) {
        setError(res.error)
      } else {
        router.push(`/bars/${res.barId}`)
      }
    })
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button type="button" onClick={send} disabled={pending} style={{ ...btn, opacity: pending ? 0.6 : 1 }}>
        {pending ? 'Sending…' : 'Send to BARS →'}
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
