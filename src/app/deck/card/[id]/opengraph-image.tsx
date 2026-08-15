import { ImageResponse } from 'next/og'
import { assembleDeck, getMoveCardById } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import {
  themeForMove,
  DECK_GOLD,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
} from '@/lib/allyship-deck/card-visuals'

/**
 * Per-card Open Graph image (1200×630) for `/deck/card/[id]`. Renders the card's title,
 * move/operation/domain, and its reading onto an element-tinted card template so the link
 * preview *looks like the card* the marketing post was about — the whole reason these
 * URLs exist. Uses `next/og` (Satori); keep the markup Satori-safe (flex only, plain hex
 * colors, no color-mix / radial-gradient).
 */

export const alt = 'An Allyship Deck card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Pre-generate an image per move card so static links have a ready preview. */
export function generateStaticParams(): { id: string }[] {
  return assembleDeck()
    .cards.filter((c): c is MoveCard => c.kind === 'move')
    .map((c) => ({ id: c.id }))
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = getMoveCardById(decodeURIComponent(id).trim().toUpperCase())

  const t = card ? themeForMove(card.move) : { gradFrom: '#241a3e', gradTo: '#100a1f', gem: DECK_GOLD }
  const title = card ? card.title : 'The Allyship Deck'
  const question = card ? card.primaryQuestion : 'Moves for the moment it counts.'
  const tags = card
    ? [MOVE_LABELS[card.move], OPERATION_LABELS[card.operation], DOMAIN_LABELS[card.domain]]
    : ['120 cards', 'Mastering Allyship']

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: `linear-gradient(135deg, ${t.gradFrom}, ${t.gradTo})`,
          border: `10px solid ${DECK_GOLD}`,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: t.gem, textTransform: 'uppercase' }}>
            {card ? card.id : 'The Allyship Deck'}
          </div>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: DECK_GOLD, textTransform: 'uppercase' }}>
            Mastering Allyship
          </div>
        </div>

        {/* title + question */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 34, marginTop: 28, color: '#e7c98a', fontStyle: 'italic', lineHeight: 1.3 }}>
            {question}
          </div>
        </div>

        {/* tag row */}
        <div style={{ display: 'flex', gap: 16 }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                fontSize: 24,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: 999,
                border: `2px solid ${t.gem}`,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
