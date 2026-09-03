import { describe, expect, it } from 'vitest'

import {
  DAY_FOURTEEN_BLANK,
  DAY_FOURTEEN_CAPACITIES,
  DAY_FOURTEEN_OPEN_STARTER,
  DAY_FOURTEEN_RECEIPT,
  dayFourteenCapacityLine,
  dayFourteenReceiptRows,
  dayFourteenRep,
} from '../day-fourteen'
import { roundThreeCardsFor, roundThreeDay } from '../round-three'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '../course-days'

describe('Day 14 — the Resourcing Rep', () => {
  it('draws six Grow Up gathering-resources cards, one per Face', () => {
    const cards = roundThreeCardsFor('grow_up')
    expect(cards).toHaveLength(6)
    expect(new Set(cards.map((c) => c.operation)).size).toBe(6)
  })

  it('keeps every card reading in one place — the row the component reads', () => {
    const day = roundThreeDay(14)
    for (const card of roundThreeCardsFor('grow_up')) {
      expect(day?.cardPrompts[card.id], card.id).toBeTruthy()
    }
  })

  it('offers six capacities, the last of which asserts nothing', () => {
    expect(DAY_FOURTEEN_CAPACITIES).toHaveLength(6)
    expect(DAY_FOURTEEN_CAPACITIES[5]).toBe(DAY_FOURTEEN_OPEN_STARTER)
  })

  it('lets the reader’s own words beat a capacity starter', () => {
    expect(dayFourteenCapacityLine('Receiving without rushing to repay', '')).toBe('Receiving without rushing to repay')
    expect(dayFourteenCapacityLine('Receiving without rushing to repay', '  asking plainly  ')).toBe('asking plainly')
    expect(dayFourteenCapacityLine(null, '')).toBe('')
  })

  it('keeps "Something else." selectable without putting words in the reader’s mouth', () => {
    expect(dayFourteenCapacityLine(DAY_FOURTEEN_OPEN_STARTER, '')).toBe('')
    expect(dayFourteenCapacityLine(DAY_FOURTEEN_OPEN_STARTER, 'my own wording')).toBe('my own wording')
  })

  it('composes the rep and its return, and shows the gaps as gaps', () => {
    expect(dayFourteenRep('make one real ask', 'I did not soften it')).toBe(
      'One notch bigger than today, I will make one real ask, and I will know it grew when I did not soften it.',
    )
    expect(dayFourteenRep('', '')).toBe(
      'One notch bigger than today, I will ___, and I will know it grew when ___.',
    )
    expect(dayFourteenRep('something', '')).toContain('___.')
  })

  it('produces a rep, not a plan or a system', () => {
    expect(DAY_FOURTEEN_RECEIPT.opening).toMatch(/one notch bigger/i)
    // Day 13 ends in a missing move; Day 8/10 build structure. Day 14 must not read
    // like either — it commits to one repetition.
    expect(DAY_FOURTEEN_RECEIPT.opening).not.toMatch(/missing move|way of organizing/i)
  })

  it('records the capacity, the rep and the return, with blanks marked', () => {
    const rows = dayFourteenReceiptRows({ capacity: 'Making a clear ask', rep: 'ask once, out loud', know: '' })
    expect(rows.map((r) => r.label)).toEqual([
      'the capacity I am growing', 'the rep, one notch bigger', 'how I will know it grew',
    ])
    expect(rows[0]).toMatchObject({ value: 'Making a clear ask', filled: true })
    expect(rows[2]).toMatchObject({ value: DAY_FOURTEEN_BLANK, filled: false })
  })

  it('ships as a shipped Week 3 day on the grow-up route', () => {
    const day = roundThreeDay(14)
    expect(day?.move).toBe('grow_up')
    expect(day?.slug).toBe('grow-up')
    expect(linkableRoute(mtgoaCourseDay(14)!)).toBe('/mastering-allyship/course/3/grow-up')
  })

  it('hands forward to a Day 15 that has not shipped, so the row reads "coming next"', () => {
    const after = nextCourseDay(14)
    expect(after?.day.number).toBe(15)
    expect(after?.route).toBeNull()
  })

  it('keeps its side door pointed at Day 13, which resolves', () => {
    expect(linkableRoute(mtgoaCourseDay(13)!)).toBeTruthy()
  })
})
