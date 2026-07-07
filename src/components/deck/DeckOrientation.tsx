'use client'

import type { CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DECK_GOLD, LIMINAL } from '@/lib/allyship-deck/card-visuals'

/** Where an orientation option sends the player — mapped to views/modes by the reader. */
export type OrientationDest = 'daily' | 'situation' | 'browse' | 'collection'

const OPTIONS: { key: OrientationDest; title: string; when: string; cta: string }[] = [
  {
    key: 'daily',
    title: 'Pull a daily card',
    when: 'For a daily centering practice. One card, one concrete move to carry into the day.',
    cta: 'Draw a card',
  },
  {
    key: 'situation',
    title: 'Read your situation',
    when: "Facing something specific? A short guided reading lays a 3-card spread for the moment you're in.",
    cta: 'Find your path',
  },
  {
    key: 'browse',
    title: 'Browse the deck',
    when: 'Looking for a particular move? Filter all 120 cards by move, face, or domain.',
    cta: 'Open the deck',
  },
  {
    key: 'collection',
    title: 'Your collection',
    when: "Revisit the cards you've drawn and keep your streak going.",
    cta: 'View collection',
  },
]

/**
 * First-run orientation for /deck — teaches the four ways to use the deck and
 * routes the player straight into the one they pick. Deck-aesthetic modal
 * (reuses the detail-overlay pattern; not CultivationCard per UI_COVENANT).
 * Shown once (localStorage in the reader) and re-openable from the top bar.
 *
 * @see .specify/specs/allyship-deck-literacy/spec.md (Phase 5)
 */
export function DeckOrientation({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (dest: OrientationDest) => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(5,4,3,.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)',
          background: SURFACE_TOKENS.surfaceElevated,
          borderRadius: 18,
          padding: 22,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 24px 48px -16px rgba(0,0,0,.9)',
        }}
      >
        <p style={kicker}>New here?</p>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 22, color: '#fff', margin: '4px 0 4px' }}>
          How to use the deck
        </h2>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 13.5, color: SURFACE_TOKENS.textSecondary, margin: '0 0 18px', lineHeight: 1.5 }}>
          Four ways in — pick what fits the moment. You can always reopen this from the “?” in the top bar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map((o) => (
            <button key={o.key} type="button" onClick={() => onSelect(o.key)} style={optionBtn}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 15, color: '#fff' }}>{o.title}</span>
                <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 10, letterSpacing: '0.04em', color: DECK_GOLD, whiteSpace: 'nowrap' }}>
                  {o.cta} →
                </span>
              </div>
              <p style={{ fontFamily: DECK_FONTS.body, fontSize: 12.5, color: SURFACE_TOKENS.textSecondary, margin: '5px 0 0', lineHeight: 1.45 }}>
                {o.when}
              </p>
            </button>
          ))}
        </div>

        <button type="button" onClick={onClose} style={laterBtn}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textMuted,
  margin: 0,
}

const optionBtn: CSSProperties = {
  textAlign: 'left',
  cursor: 'pointer',
  padding: '13px 15px',
  borderRadius: 12,
  background: SURFACE_TOKENS.surfaceInset,
  border: '1px solid rgba(255,255,255,.12)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
}

const laterBtn: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 16,
  padding: '11px',
  borderRadius: 10,
  border: `1px solid ${LIMINAL.frame}`,
  background: 'transparent',
  color: SURFACE_TOKENS.textSecondary,
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}
