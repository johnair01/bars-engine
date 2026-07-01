'use client'

import { useState, type CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DOMAIN_LABELS } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { CardSubject } from './AllyshipCard'

/**
 * "How this shows up in real life" — the applications disclosure on a card.
 *
 * Deterministic and always non-empty (honoring the AI-allergic community):
 * authored `card.applications` when present, otherwise a fallback derived from
 * the card's own canonical data (domain framing + the other reading). The
 * optional AI "apply to my situation" step (Phase 4) layers on top of this
 * baseline — it never replaces it.
 *
 * @see .specify/specs/allyship-deck-literacy/spec.md (Phase 3)
 */
export function CardApplications({ card, subject }: { card: MoveCard; subject: CardSubject }) {
  const [open, setOpen] = useState(false)
  const items = card.applications?.length ? card.applications : fallbackApplications(card, subject)

  return (
    <div style={{ marginTop: 14 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={toggle} aria-expanded={open}>
        {open ? '▾' : '▸'} How this shows up in real life
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {items.map((it, i) => (
            <div key={i} style={item}>
              <div style={label}>{it.context}</div>
              <div style={{ fontFamily: DECK_FONTS.body, fontSize: 13.5, color: '#fff', marginTop: 2, lineHeight: 1.45 }}>
                {it.example}
              </div>
            </div>
          ))}
          {!card.applications?.length && (
            <p style={{ fontFamily: DECK_FONTS.body, fontSize: 11.5, fontStyle: 'italic', color: SURFACE_TOKENS.textMuted, margin: '2px 0 0' }}>
              Drawn from this card — worked examples for this move are still being written.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Deterministic fallback so the section is never empty and never needs AI. */
function fallbackApplications(card: MoveCard, subject: CardSubject): { context: string; example: string }[] {
  const otherReading =
    subject === 'campaign'
      ? { context: 'In your own practice', example: card.primaryQuestion }
      : { context: 'For a campaign or someone else', example: card.campaignQuestion }
  return [
    { context: `In ${DOMAIN_LABELS[card.domain]}`, example: card.optimizesFor },
    otherReading,
  ]
}

const toggle: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textSecondary,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const item: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  background: SURFACE_TOKENS.surfaceInset,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 1px rgba(255,255,255,.08)',
}

const label: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#e7c98a',
}
