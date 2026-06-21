'use client'

/**
 * Go Deeper — clickable superpower-move surface on a deck card.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 4)
 *
 * Resolves the player's matching superpower move for this card. Owners see the
 * full move; non-owners see a cite + upsell; anon/loadout-less players get a
 * prompt. Renders nothing when there's no publishable move at the coordinate.
 */

import { useEffect, useState } from 'react'
import { getCardGoDeeper, type CardGoDeeper } from '@/actions/deck-techniques'

const SP_LABEL: Record<string, string> = {
  strategist: 'Strategist',
  connector: 'Connector',
  escape_artist: 'Escape Artist',
  disruptor: 'Disruptor',
  alchemist: 'Alchemist',
  storyteller: 'Storyteller',
  coach: 'Coach',
}

const box: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 12px',
  borderRadius: 10,
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)',
  fontSize: 13,
  lineHeight: 1.45,
}
const link: React.CSSProperties = { color: '#9ad', textDecoration: 'underline', cursor: 'pointer' }

export function GoDeeper({ cardId, subject }: { cardId: string; subject: 'self' | 'other' | 'collective' }) {
  const [data, setData] = useState<CardGoDeeper | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let live = true
    getCardGoDeeper(cardId, subject)
      .then((r) => {
        if (live) setData(r)
      })
      .catch(() => {
        if (live) setData({ state: 'not_found' })
      })
    return () => {
      live = false
    }
  }, [cardId, subject])

  if (!data || data.state === 'not_found' || data.state === 'unavailable') return null

  if (data.state === 'needs_login') {
    return (
      <div style={box}>
        Go Deeper: <a href="/login" style={link}>log in</a> to see your superpower&rsquo;s move for this card.
      </div>
    )
  }
  if (data.state === 'needs_quiz') {
    return (
      <div style={box}>
        Go Deeper: <a href="/launch" style={link}>find your superpower</a> to unlock the move for this card.
      </div>
    )
  }

  const label = SP_LABEL[data.superpower] ?? data.superpower

  if (data.state === 'locked') {
    return (
      <div style={box}>
        <strong>Go Deeper — your {label} has a move here.</strong>
        <div style={{ marginTop: 6 }}>
          <a href="/launch" style={link}>Unlock the {label} deck</a> to see it.
        </div>
      </div>
    )
  }

  // ok — owned
  const t = data.technique
  if (!t) return null
  return (
    <div style={box}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...link, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
        {open ? '▾' : '▸'} Go Deeper — {label}: {t.name}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: '0 0 8px', opacity: 0.85 }}>{t.essence}</p>
          <ol style={{ margin: '0 0 8px 18px', padding: 0 }}>
            {t.steps.map((s, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{s}</li>
            ))}
          </ol>
          {t.tell && (
            <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>
              <strong>Working:</strong> {t.tell.working} &nbsp;·&nbsp; <strong>Performed:</strong> {t.tell.performed}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
