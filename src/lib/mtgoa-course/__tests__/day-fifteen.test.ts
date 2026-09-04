import { describe, expect, it } from 'vitest'

import {
  DAY_FIFTEEN_BLANK,
  DAY_FIFTEEN_CONSENT,
  DAY_FIFTEEN_SHAPES,
  dayFifteenMessage,
  dayFifteenMove,
  dayFifteenReceiptRows,
  dayFifteenShape,
} from '../day-fifteen'
import { roundThreeCardsFor, roundThreeDay } from '../round-three'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '../course-days'

describe('Day 15 — the Resourcing Move', () => {
  it('draws six Show Up gathering-resources cards, one per Face', () => {
    const cards = roundThreeCardsFor('show_up')
    expect(cards).toHaveLength(6)
    expect(new Set(cards.map((c) => c.operation)).size).toBe(6)
  })

  it('keeps every card reading in one place — the row the component reads', () => {
    const day = roundThreeDay(15)
    for (const card of roundThreeCardsFor('show_up')) {
      expect(day?.cardPrompts[card.id], card.id).toBeTruthy()
    }
  })

  it('offers exactly two shapes: an offer and an ask', () => {
    expect(DAY_FIFTEEN_SHAPES.map((s) => s.key)).toEqual(['offer', 'ask'])
    expect(dayFifteenShape('offer')?.label).toMatch(/offering/i)
    expect(dayFifteenShape(null)).toBeNull()
  })

  it('composes each shape’s move, and shows the gaps as gaps', () => {
    expect(dayFifteenMove('offer', 'a spare studio hour', 'your recording')).toBe(
      'I have a spare studio hour and I would like you to have it for your recording.',
    )
    expect(dayFifteenMove('ask', 'lend me the projector', 'we can screen it Friday')).toBe(
      'Could you lend me the projector so that we can screen it Friday?',
    )
    expect(dayFifteenMove('offer', '', '')).toBe('I have ___ and I would like you to have it for ___.')
    expect(dayFifteenMove(null, 'x', 'y')).toBe('')
  })

  it('appends the consent line to the full message, and only when a shape is chosen', () => {
    const msg = dayFifteenMessage('ask', 'lend me the projector', 'we can screen it Friday')
    expect(msg.endsWith(DAY_FIFTEEN_CONSENT)).toBe(true)
    expect(msg).toContain('Could you lend me the projector')
    // No shape → empty, so the receipt never shows a bare consent line with no ask.
    expect(dayFifteenMessage(null, 'x', 'y')).toBe('')
  })

  it('records the shape, recipient and move, with blanks marked', () => {
    const rows = dayFifteenReceiptRows({ shape: 'offer', recipient: 'M.', first: 'a studio hour', second: '' })
    expect(rows.map((r) => r.label)).toEqual(['the move', 'who it is for', 'the resource', 'what it is for'])
    expect(rows[0]).toMatchObject({ filled: true })
    expect(rows[1]).toMatchObject({ value: 'M.', filled: true })
    expect(rows[3]).toMatchObject({ value: DAY_FIFTEEN_BLANK, filled: false })
  })

  it('ships as the final Week 3 day, on the show-up route', () => {
    const day = roundThreeDay(15)
    expect(day?.move).toBe('show_up')
    expect(day?.slug).toBe('show-up')
    expect(linkableRoute(mtgoaCourseDay(15)!)).toBe('/mastering-allyship/course/3/show-up')
  })

  it('hands forward to a Day 16 that opens the unauthored Round 4, so the row reads "coming next"', () => {
    const after = nextCourseDay(15)
    expect(after?.day.number).toBe(16)
    expect(after?.day.round).toBe(4)
    expect(after?.route).toBeNull()
  })
})
