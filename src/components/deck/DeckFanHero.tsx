import type { CSSProperties } from 'react'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { AllyshipCard } from './AllyshipCard'

/**
 * The Sales hero's fan of three cards — overlapping, gently rotated, the center card
 * raised. Presentational only (no hooks); renders the real `AllyshipCard` grid tile so
 * the hero shows actual deck content, not a mock. Pass three distinct-element cards for
 * the most colorful fan (e.g. water / fire / liminal).
 *
 * @see src/app/deck/sales/page.tsx
 */
export function DeckFanHero({ cards }: { cards: [MoveCard, MoveCard, MoveCard] }) {
  // left, center, right — center is upright and lifted; the wings splay out and down.
  const poses: CSSProperties[] = [
    { transform: 'rotate(-9deg) translate(34px, 20px)', zIndex: 1 },
    { transform: 'rotate(0deg) translateY(-4px)', zIndex: 3 },
    { transform: 'rotate(9deg) translate(-34px, 20px)', zIndex: 1 },
  ]

  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: 250,
      }}
    >
      {cards.map((card, i) => (
        <div
          key={card.id}
          style={{
            width: 188,
            margin: i === 1 ? '0 -18px' : 0,
            ...poses[i],
            filter: i === 1 ? 'none' : 'saturate(0.95) brightness(0.96)',
          }}
        >
          <AllyshipCard card={card} variant="grid" />
        </div>
      ))}
    </div>
  )
}
