import { describe, expect, it } from 'vitest'

import {
  DAY_THIRTEEN_BLANK,
  DAY_THIRTEEN_OPENERS,
  DAY_THIRTEEN_OPEN_STARTER,
  DAY_THIRTEEN_RECEIPT,
  DAY_THIRTEEN_STARTERS,
  dayThirteenMove,
  dayThirteenPartName,
  dayThirteenReceiptRows,
  dayThirteenStrainLine,
} from '../day-thirteen'
import { roundThreeCardsFor, roundThreeDay } from '../round-three'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '../course-days'

describe('Day 13 — the Resourcing 3-2-1', () => {
  it('draws six Clean Up gathering-resources cards, one per Face', () => {
    const cards = roundThreeCardsFor('clean_up')
    expect(cards).toHaveLength(6)
    // One card per operation, so the Day 13 row can carry a reading per card.
    expect(new Set(cards.map((c) => c.operation)).size).toBe(6)
  })

  it('keeps every card reading in one place — the row that the component reads', () => {
    // The readings live only on the round-three row's cardPrompts, keyed by id.
    // There is no second per-Face lens table to drift out of step with it.
    const day = roundThreeDay(13)
    for (const card of roundThreeCardsFor('clean_up')) {
      expect(day?.cardPrompts[card.id], card.id).toBeTruthy()
    }
  })

  it('offers six starters, the last of which asserts nothing', () => {
    expect(DAY_THIRTEEN_STARTERS).toHaveLength(6)
    expect(DAY_THIRTEEN_STARTERS[5]).toBe(DAY_THIRTEEN_OPEN_STARTER)
    expect(DAY_THIRTEEN_OPENERS).toHaveLength(5)
  })

  it('lets the reader’s own words beat a starter', () => {
    expect(dayThirteenStrainLine('Who am I to ask for that?', '')).toBe('Who am I to ask for that?')
    expect(dayThirteenStrainLine('Who am I to ask for that?', '  it is safer to give  ')).toBe('it is safer to give')
    expect(dayThirteenStrainLine(null, '')).toBe('')
  })

  it('keeps "Something else." selectable without putting words in the reader’s mouth', () => {
    expect(dayThirteenStrainLine(DAY_THIRTEEN_OPEN_STARTER, '')).toBe('')
    expect(dayThirteenStrainLine(DAY_THIRTEEN_OPEN_STARTER, 'my own wording')).toBe('my own wording')
  })

  it('calls an unnamed part "the part", everywhere', () => {
    expect(dayThirteenPartName('')).toBe('the part')
    expect(dayThirteenPartName('   ')).toBe('the part')
    expect(dayThirteenPartName('  The Provider ')).toBe('The Provider')
  })

  it('composes the missing move, and shows the gaps as gaps', () => {
    expect(dayThirteenMove('name the real ask in one sentence', 'quietly covering it')).toBe(
      'When a resource has to move, the missing move is to name the real ask in one sentence, instead of quietly covering it.',
    )
    expect(dayThirteenMove('', '')).toBe(
      'When a resource has to move, the missing move is to ___, instead of ___.',
    )
    expect(dayThirteenMove('something', '')).toContain('___.')
  })

  it('ends in a missing move rather than an organizing condition', () => {
    // Day 8 produces an organizing condition; Day 13 must not — the wording is
    // what keeps the two 3-2-1 days from collapsing into the same day.
    expect(DAY_THIRTEEN_RECEIPT.opening).toMatch(/missing move/i)
    expect(DAY_THIRTEEN_RECEIPT.opening).not.toMatch(/way of organizing/i)
  })

  it('records the pass with blanks marked, and omits "what shifted" when it was skipped', () => {
    const base = { strain: 'Who am I to ask for that?', they: '', thread: [], i: '', shift: '', partName: 'the part' }
    const rows = dayThirteenReceiptRows(base)
    expect(rows.map((r) => r.label)).toEqual([
      'the strain I named', '3 · faced it as they', '2 · talked with the part', '1 · spoke as I',
    ])
    expect(rows[0]).toMatchObject({ value: 'Who am I to ask for that?', filled: true })
    expect(rows[1]).toMatchObject({ value: DAY_THIRTEEN_BLANK, filled: false })

    const withShift = dayThirteenReceiptRows({ ...base, shift: 'it loosened' })
    expect(withShift.at(-1)).toMatchObject({ label: 'what shifted', value: 'it loosened', filled: true })
  })

  it('counts the thread and quotes its last turn, under the part’s name', () => {
    const rows = dayThirteenReceiptRows({
      strain: '', they: '', i: '', shift: '', partName: 'The Provider',
      thread: [
        { from: 'me', text: 'What are you afraid runs out?' },
        { from: 'it', text: 'That if I ask, they will finally say no.' },
      ],
    })
    const turn = rows.find((r) => r.label === '2 · talked with The Provider')!
    expect(turn.value).toContain('2 turns')
    expect(turn.value).toContain('That if I ask, they will finally say no.')
    expect(turn.filled).toBe(true)

    const one = dayThirteenReceiptRows({
      strain: '', they: '', i: '', shift: '', partName: 'the part',
      thread: [{ from: 'me', text: 'hello' }],
    })
    expect(one.find((r) => r.label.startsWith('2 ·'))!.value).toContain('1 turn')
  })

  it('ships as a shipped Week 3 day whose card prompts cover its six cards', () => {
    const day = roundThreeDay(13)
    expect(day?.move).toBe('clean_up')
    expect(day?.slug).toBe('clean-up')
    for (const card of roundThreeCardsFor('clean_up')) {
      expect(day?.cardPrompts[card.id]).toBeTruthy()
    }
    expect(linkableRoute(mtgoaCourseDay(13)!)).toBe('/mastering-allyship/course/3/clean-up')
  })

  it('hands forward to Day 14, which now ships', () => {
    const after = nextCourseDay(13)
    expect(after?.day.number).toBe(14)
    expect(after?.route).toBe('/mastering-allyship/course/3/grow-up')
  })

  it('keeps its side doors pointed at days that resolve', () => {
    for (const day of [11, 12]) {
      expect(linkableRoute(mtgoaCourseDay(day)!)).toBeTruthy()
    }
  })
})
