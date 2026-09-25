import { describe, expect, it } from 'vitest'

import {
  DAY_EIGHT_BLANK,
  DAY_EIGHT_LENS,
  DAY_EIGHT_OPENERS,
  DAY_EIGHT_OPEN_STARTER,
  DAY_EIGHT_RECEIPT,
  DAY_EIGHT_STARTERS,
  dayEightCondition,
  dayEightLens,
  dayEightPartName,
  dayEightReceiptRows,
  dayEightStrainLine,
} from '../day-eight'
import { roundTwoCardsFor, roundTwoDay } from '../round-two'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '../course-days'

describe('Day 8 — the Organization Bottleneck 3-2-1', () => {
  it('carries a reading of every Clean Up organizing card, keyed by Face', () => {
    const cards = roundTwoCardsFor('clean_up')
    expect(cards).toHaveLength(6)
    // One card per operation is what makes the Face a safe key.
    expect(new Set(cards.map((c) => c.operation)).size).toBe(6)
    for (const card of cards) {
      expect(dayEightLens(card)).toBe(DAY_EIGHT_LENS[card.operation])
      expect(dayEightLens(card)).toBeTruthy()
    }
  })

  it('offers six starters, the last of which asserts nothing', () => {
    expect(DAY_EIGHT_STARTERS).toHaveLength(6)
    expect(DAY_EIGHT_STARTERS[5]).toBe(DAY_EIGHT_OPEN_STARTER)
    expect(DAY_EIGHT_OPENERS).toHaveLength(5)
  })

  it('lets the reader’s own words beat a starter', () => {
    expect(dayEightStrainLine('Only I can do this.', '')).toBe('Only I can do this.')
    expect(dayEightStrainLine('Only I can do this.', '  it is faster if I do it  ')).toBe('it is faster if I do it')
    expect(dayEightStrainLine(null, '')).toBe('')
  })

  it('keeps "Something else." selectable without putting words in the reader’s mouth', () => {
    expect(dayEightStrainLine(DAY_EIGHT_OPEN_STARTER, '')).toBe('')
    expect(dayEightStrainLine(DAY_EIGHT_OPEN_STARTER, 'my own wording')).toBe('my own wording')
  })

  it('calls an unnamed part "the part", everywhere', () => {
    expect(dayEightPartName('')).toBe('the part')
    expect(dayEightPartName('   ')).toBe('the part')
    expect(dayEightPartName('  The Carrier ')).toBe('The Carrier')
  })

  it('composes the condition, and shows the gaps as gaps', () => {
    expect(dayEightCondition('lets one piece be handed off', 'putting everything through one person')).toBe(
      'This work needs a way of organizing that lets one piece be handed off, because the current pattern keeps putting everything through one person.',
    )
    expect(dayEightCondition('', '')).toBe(
      'This work needs a way of organizing that ___, because the current pattern keeps ___.',
    )
    expect(dayEightCondition('something', '')).toContain('___.')
  })

  it('ends in a condition rather than a plan, and says so in the same words as the page', () => {
    expect(DAY_EIGHT_RECEIPT.opening).toMatch(/way of organizing/i)
    // The shipped stem produced a structure for the campaign, which is Day 10's job.
    expect(DAY_EIGHT_RECEIPT.opening).not.toMatch(/campaign needs a structure/i)
    // The round-two row feeds the course index and the OG card, so it has to agree.
    expect(roundTwoDay(8)?.receipt.stem).toContain('way of organizing')
  })

  it('records the pass with blanks marked, and omits "what shifted" when it was skipped', () => {
    const base = { strain: 'Only I can do this.', they: '', thread: [], i: '', shift: '', partName: 'the part' }
    const rows = dayEightReceiptRows(base)
    expect(rows.map((r) => r.label)).toEqual([
      'the strain I named', '3 · faced it as they', '2 · talked with the part', '1 · spoke as I',
    ])
    expect(rows[0]).toMatchObject({ value: 'Only I can do this.', filled: true })
    expect(rows[1]).toMatchObject({ value: DAY_EIGHT_BLANK, filled: false })

    const withShift = dayEightReceiptRows({ ...base, shift: 'it loosened' })
    expect(withShift.at(-1)).toMatchObject({ label: 'what shifted', value: 'it loosened', filled: true })
  })

  it('counts the thread and quotes its last turn, under the part’s name', () => {
    const rows = dayEightReceiptRows({
      strain: '', they: '', i: '', shift: '', partName: 'The Carrier',
      thread: [
        { from: 'me', text: 'What are you protecting?' },
        { from: 'it', text: 'The people who would be let down.' },
      ],
    })
    const turn = rows.find((r) => r.label === '2 · talked with The Carrier')!
    expect(turn.value).toContain('2 turns')
    expect(turn.value).toContain('The people who would be let down.')
    expect(turn.filled).toBe(true)

    const one = dayEightReceiptRows({
      strain: '', they: '', i: '', shift: '', partName: 'the part',
      thread: [{ from: 'me', text: 'hello' }],
    })
    expect(one.find((r) => r.label.startsWith('2 ·'))!.value).toContain('1 turn')
  })

  it('hands forward to a Day 9 that actually resolves', () => {
    const after = nextCourseDay(8)
    expect(after?.day.number).toBe(9)
    // The prototype showed Day 9 as a disabled "soon". It ships now, so the row links.
    expect(after?.route).toBe('/mastering-allyship/course/2/grow-up')
  })

  it('keeps its side doors pointed at days that resolve', () => {
    for (const day of [7, 3]) {
      expect(linkableRoute(mtgoaCourseDay(day)!)).toBeTruthy()
    }
  })
})
