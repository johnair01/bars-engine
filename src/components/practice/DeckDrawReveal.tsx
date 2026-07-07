'use client'

// ---------------------------------------------------------------------------
// DeckDrawReveal — draw an Allyship card (closes G13). The drawn card fixes the
// composer's WAVE submove + domain + stance question. Deck design language
// (DECK_GOLD frame, themeForMove gradient, move glyph, DECK_FONTS), mirroring
// AllyshipCard so the draw reads as part of the deck family.
// ---------------------------------------------------------------------------

import { useState, type CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  themeForMove,
  DECK_GOLD,
  INSET_TOP,
  DECK_FONTS,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
  MOVE_ICON_PATHS,
  MOVE_ICON_FILLED,
} from '@/lib/allyship-deck/card-visuals'
import { drawMoveCard } from '@/lib/emotional-alchemy'
import type { MoveCard } from '@/lib/allyship-deck/types'

const kicker: CSSProperties = { fontFamily: DECK_FONTS.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: SURFACE_TOKENS.textSecondary }

export function DeckDrawReveal({ onUse, onBack }: { onUse: (card: MoveCard) => void; onBack: () => void }) {
  const [card, setCard] = useState<MoveCard>(() => drawMoveCard())
  const t = themeForMove(card.move)

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <span style={kicker}>Draw a card</span>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 22, color: '#fff', margin: '4px 0 4px' }}>The deck picks the move.</h2>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, margin: 0, lineHeight: 1.5 }}>
          This card fixes the move your charge will run through. If it doesn&apos;t land, draw again.
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          border: `2px solid ${DECK_GOLD}`,
          background: `radial-gradient(120% 90% at 78% 8%, ${t.gradFrom}, ${t.gradTo} 64%)`,
          boxShadow: `${INSET_TOP}, 0 0 26px 1px color-mix(in srgb, ${t.glow} 36%, transparent), 0 18px 40px -20px rgba(0,0,0,.9)`,
          padding: 20,
          display: 'grid',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={30} height={30} viewBox="0 0 64 64" aria-hidden>
              {MOVE_ICON_PATHS[card.move].map((d, i) => (
                <path key={i} d={d} fill={MOVE_ICON_FILLED[card.move] ? t.gem : 'none'} stroke={MOVE_ICON_FILLED[card.move] ? 'none' : t.gem} strokeWidth={MOVE_ICON_FILLED[card.move] ? 0 : 3} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
            <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gem }}>{MOVE_LABELS[card.move]}</span>
          </span>
          <span style={{ ...kicker }}>{card.num}</span>
        </div>

        <h3 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 22, color: '#fff', margin: 0 }}>{card.title}</h3>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, lineHeight: 1.5, color: SURFACE_TOKENS.textPrimary, margin: 0 }}>{card.primaryQuestion}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>◇ {OPERATION_LABELS[card.operation]}</span>
          <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>· {DOMAIN_LABELS[card.domain]}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setCard((c) => drawMoveCard(Math.random, c.id))}
          style={{ fontFamily: DECK_FONTS.mono, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: '1px solid rgba(255,255,255,.14)', borderRadius: 8, padding: '10px 14px', color: SURFACE_TOKENS.textSecondary, cursor: 'pointer' }}
        >
          Draw again
        </button>
        <button
          type="button"
          onClick={() => onUse(card)}
          style={{ marginLeft: 'auto', fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 14, background: DECK_GOLD, border: `1px solid ${DECK_GOLD}`, borderRadius: 10, padding: '11px 20px', color: '#150a04', cursor: 'pointer' }}
        >
          Use this move →
        </button>
      </div>
      <button type="button" onClick={onBack} style={{ ...kicker, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: SURFACE_TOKENS.textMuted, justifySelf: 'start' }}>← Back to the read</button>
    </div>
  )
}
