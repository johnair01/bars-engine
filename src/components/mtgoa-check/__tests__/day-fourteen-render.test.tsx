import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DayFourteenResourcingRep } from '../DayFourteenResourcingRep'
import { roundThreeCardsFor } from '@/lib/mtgoa-course/round-three'

function textOf(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('DayFourteenResourcingRep', () => {
  it('opens on the entry screen, in Grow Up wood, with the row’s copy', () => {
    const text = textOf(<DayFourteenResourcingRep cards={roundThreeCardsFor('grow_up')} />)
    expect(text).toContain('Week 3 · Gather Resources · Day 14 of 30')
    // Grow Up's element is wood — the glyph proves the covenant.
    expect(text).toContain('grow up · 木')
    expect(text).toContain('Give one resourcing capacity a rep')
    // This sentence lives only on the Day 14 row's `entry` — proof of single source.
    expect(text).toContain('Day 13 named the move you keep skipping')
    expect(text).toContain('Read the book')
  })

  it('does not throw when the card draw is empty', () => {
    expect(() => renderToStaticMarkup(<DayFourteenResourcingRep cards={[]} />)).not.toThrow()
  })
})
