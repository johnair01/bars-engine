import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DayElevenStartingHand } from '../DayElevenStartingHand'
import { roundThreeCardsFor } from '@/lib/mtgoa-course/round-three'

/**
 * Day 11 mounts and opens on its entry screen.
 *
 * A smoke render rather than a flow test: it proves the component composes with
 * CheckKit and CardDraw without throwing, and that the chrome a reader sees
 * first is the Week 3 chrome.
 */
function textOf(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('DayElevenStartingHand', () => {
  const cards = roundThreeCardsFor('wake_up')

  it('opens on the Week 3 entry screen', () => {
    const text = textOf(<DayElevenStartingHand cards={cards} />)
    expect(text).toContain('Week 3 · Gather Resources · Day 11 of 30')
    expect(text).toContain('wake up · 土')
    expect(text).toContain('You are waiting to feel influential')
    expect(text).toContain('Count what you can reach')
    expect(text).toContain('a refresh clears it')
  })

  it('renders without a card carried, so an empty draw cannot throw', () => {
    expect(() => renderToStaticMarkup(<DayElevenStartingHand cards={[]} />)).not.toThrow()
  })
})
