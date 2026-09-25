import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DayTwelveResourceQuestion } from '../DayTwelveResourceQuestion'
import { roundThreeCardsFor } from '@/lib/mtgoa-course/round-three'

function textOf(node: Parameters<typeof renderToStaticMarkup>[0]): string {
  return renderToStaticMarkup(node).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('DayTwelveResourceQuestion', () => {
  it('opens with the Day 11 prerequisite router', () => {
    const text = textOf(<DayTwelveResourceQuestion cards={roundThreeCardsFor('open_up')} />)
    expect(text).toContain('Week 3 · Gather Resources · Day 12 of 30')
    expect(text).toContain('Hold the Resource Question')
    expect(text).toContain('open up · 間')
    expect(text).toContain('I am not sure what resource I have to work with')
    expect(text).toContain('start with Day 11’s Resource Ledger')
  })

  it('does not throw when the card draw is empty', () => {
    expect(() => renderToStaticMarkup(<DayTwelveResourceQuestion cards={[]} />)).not.toThrow()
  })
})
