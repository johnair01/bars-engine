import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DayThirteenResourcingPart } from '../DayThirteenResourcingPart'
import { roundThreeCardsFor } from '@/lib/mtgoa-course/round-three'

function textOf(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('DayThirteenResourcingPart', () => {
  it('opens on the entry screen, in Clean Up water, with the resourcing framing', () => {
    const text = textOf(<DayThirteenResourcingPart cards={roundThreeCardsFor('clean_up')} />)
    expect(text).toContain('Week 3 · Gather Resources · Day 13 of 30')
    // Clean Up's element is water in every round — the glyph proves the covenant.
    expect(text).toContain('clean up · 水')
    expect(text).toContain('Before you fix how you resource this')
    expect(text).toContain('Work the resourcing part')
    // The book door at the beginning.
    expect(text).toContain('Read the book')
  })

  it('renders the entry paragraph from the round-three row, not a second inline copy', () => {
    const text = textOf(<DayThirteenResourcingPart cards={roundThreeCardsFor('clean_up')} />)
    // This exact sentence lives only on the Day 13 row's `entry`. Seeing it here
    // is the proof the component reads the row rather than a duplicate.
    expect(text).toContain('Day 11 counted what is in reach')
  })

  it('does not throw when the card draw is empty', () => {
    expect(() => renderToStaticMarkup(<DayThirteenResourcingPart cards={[]} />)).not.toThrow()
  })
})
