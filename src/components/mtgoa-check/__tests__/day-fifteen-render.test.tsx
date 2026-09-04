import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DayFifteenResourcingMove } from '../DayFifteenResourcingMove'
import { roundThreeCardsFor } from '@/lib/mtgoa-course/round-three'

function textOf(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('DayFifteenResourcingMove', () => {
  it('opens on the entry screen, in Show Up fire, with the row’s copy', () => {
    const text = textOf(<DayFifteenResourcingMove cards={roundThreeCardsFor('show_up')} />)
    expect(text).toContain('Week 3 · Gather Resources · Day 15 of 30')
    // Show Up's element is fire — the glyph proves the covenant.
    expect(text).toContain('show up · 火')
    expect(text).toContain('Make one real move')
    // This sentence lives only on the Day 15 row's `entry` — proof of single source.
    expect(text).toContain('You counted what is in reach')
    expect(text).toContain('Read the book')
  })

  it('does not throw when the card draw is empty', () => {
    expect(() => renderToStaticMarkup(<DayFifteenResourcingMove cards={[]} />)).not.toThrow()
  })
})
