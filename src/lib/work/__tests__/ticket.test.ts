import { describe, expect, it } from 'vitest'
import { ticketFromAnswer, ticketFromStep } from '../ticket'
import { cleanLanes, firstLitLane } from '../lanes'

const row = {
  q: 'Does this look like the work queues you want?',
  options: [{ v: 'A', label: 'A. Yes, build it this way (recommended)' }, { v: 'C', label: 'C. Redraw', then: 'Run round 3.' }],
}

describe('ticketFromAnswer', () => {
  it('sends his answer with the gate line when the option names no brief', () => {
    const t = ticketFromAnswer('council', 'questions', 'wq-look-3', { choice: 'A', steer: '', savedAt: '2026-10-31T02:02:43Z' }, row)!
    expect(t.sourceKey).toBe('council/questions/wq-look-3@A')
    expect(t.lanes).toEqual(['claude', 'freebuff'])
    expect(t.basis).toMatchObject({ rows: ['wq-look-3'], answer: 'A', label: 'Yes, build it this way' })
    expect(t.brief).toContain('Wendell answered wq-look-3 on the Council Board: Yes, build it this way.')
    expect(t.brief).toContain('python3 board/gates.py wq-look-3 --line --live')
    expect(t.brief).toContain('this ticket is the gate\'s claim')
    expect(t.brief).not.toContain('--push')
    expect(t.title).toBe(row.q)
  })
  it("uses the chosen option's then, and keys a steer apart from the bare answer", () => {
    const t = ticketFromAnswer('council', 'questions', 'wq-look-3', { choice: 'C', steer: 'bigger worlds' }, row)!
    expect(t.brief).toContain('Run round 3.')
    expect(t.brief).toContain('"bigger worlds"')
    expect(t.sourceKey).toMatch(/^council\/questions\/wq-look-3@C\+[0-9a-f]{8}$/)
  })
  it('sends nothing for a save with no answer and no steer, and works without a row', () => {
    expect(ticketFromAnswer('council', 'questions', 'x', { choice: '', steer: ' ' }, null)).toBeNull()
    expect(ticketFromAnswer('council', 'questions', 'x', { steer: 'hold this' }, null)!.title).toBe('His answer on x')
  })
  it("honours a row's own lanes, known lanes only", () => {
    expect(ticketFromAnswer('council', 'questions', 'x', { choice: 'A' }, { lanes: ['freebuff', 'zo'] })!.lanes).toEqual(['freebuff'])
  })
})

describe('lanes', () => {
  it('cleans a lane list and never leaves it empty', () => {
    expect(cleanLanes(['claude', 'claude', 'nope'])).toEqual(['claude'])
    expect(cleanLanes(undefined)).toEqual(['claude', 'freebuff'])
  })
  it('takes the first lit lane, or the last when every lamp is out', () => {
    expect(firstLitLane(['claude', 'freebuff'], new Set(['claude']))).toBe('freebuff')
    expect(firstLitLane(['claude', 'freebuff'], new Set(['claude', 'freebuff']))).toBe('freebuff')
  })
})

describe('pull now', () => {
  it('makes one claude-lane ticket per minute with the pull:now row', async () => {
    const { ticketFromPullNow } = await import('../harbour-send')
    const a = ticketFromPullNow(new Date('2026-11-02T22:30:05Z'))
    const b = ticketFromPullNow(new Date('2026-11-02T22:30:50Z'))
    expect(a.sourceKey).toBe(b.sourceKey)
    expect(a.basis.rows).toEqual(['pull:now'])
    expect(a.lanes).toEqual(['claude'])
  })
})

describe('ticketFromStep', () => {
  const card = { title: 'Spec out a way to translate Self-Help and Therapy books into game content and quests' }
  it('makes a Claude-lane Shaman intake ticket carrying the step id and his note', () => {
    const t = ticketFromStep('council', 'steps', 'st-21', { ...card, grow: { kind: 'grow', face: 'Shaman', text: 'start with CBT', at: '2026-11-03T19:00:00Z' } })!
    expect(t.title).toBe(('Shaman intake: ' + card.title).slice(0, 89) + '…')
    expect(t.lanes).toEqual(['claude'])
    expect(t.sourceKey).toBe('council/steps/st-21@grow:2026-11-03T19:00:00Z')
    expect(t.brief).toContain('steps/st-21')
    expect(t.brief).toContain('"start with CBT"')
  })
  it('names the card by the words Your steps saves under do, never by its id', () => {
    const t = ticketFromStep('council', 'steps', 'ttv-cmvykjlie000fxpmg793m9w6r', { do: 'Spec out a way to translate books', grow: { face: 'Shaman', at: 'a' } })!
    expect(t.title).toBe('Shaman intake: Spec out a way to translate books')
    expect(t.brief).toContain('"Spec out a way to translate books"')
  })
  it('titles a fit read by face and a council read plainly', () => {
    expect(ticketFromStep('council', 'steps', 's', { title: 'X', grow: { kind: 'fit', face: 'Architect', at: 'a' } })!.title).toBe('Architect read: X')
    expect(ticketFromStep('council', 'steps', 's', { title: 'X', grow: { kind: 'council', at: 'a' } })!.title).toBe('Council read: X')
  })
  it('makes nothing once a reading at or after grow.at exists, or without grow, or on another board', () => {
    const grow = { face: 'Shaman', at: '2026-11-03T19:00:00Z' }
    expect(ticketFromStep('council', 'steps', 's', { ...card, grow, grown: [{ at: '2026-11-03T19:05:00Z' }] })).toBeNull()
    expect(ticketFromStep('council', 'steps', 's', { ...card, grow, grown: [{ at: '2026-11-02T10:00:00Z' }] })).not.toBeNull()
    expect(ticketFromStep('council', 'steps', 's', { ...card, grow: null })).toBeNull()
    expect(ticketFromStep('nonprofit', 'steps', 's', { ...card, grow })).toBeNull()
  })
  it('keys a resave to the same ticket and a second hand-off to a new one', () => {
    const k = (at: string) => ticketFromStep('council', 'steps', 's', { ...card, grow: { face: 'Shaman', at } })!.sourceKey
    expect(k('t1')).toBe(k('t1'))
    expect(k('t1')).not.toBe(k('t2'))
  })
})

import { ticketFromLever } from '../ticket'

describe('ticketFromLever', () => {
  const row = { q: 'x', card: { project: 'Harbour', front: { next_step: 'Draw the tide.' } } }
  const pull = { move: 'claude_takes_it', savedAt: '2026-11-04T01:00:00Z' }
  it('makes a ready claude ticket that names the receipt first', () => {
    const t = ticketFromLever('council', 'positions', 'c1', pull, row)!
    expect(t.sourceKey).toBe('council/positions/c1@lever:2026-11-04T01:00:00Z')
    expect(t.lanes).toEqual(['claude'])
    expect(t.basis).toMatchObject({ rows: ['c1'] })
    expect(t.brief).toContain('python3 board/receipt.py write c1')
    expect(t.title).toBe('Draw the tide.')
    expect(t.state).toBeUndefined()
  })
  it('takes the lane the save names, so a tap can fill the freebuff deck', () => {
    const t = ticketFromLever('council', 'positions', 'np-serve-data', { move: 'claude_takes_it', savedAt: '2026-11-05T23:00:00Z', lane: 'freebuff' }, null)!
    expect(t.lanes).toEqual(['freebuff'])
  })
  it('lets a row lane stand when the save names none, and takes a typo back to claude', () => {
    const row = { lanes: ['freebuff'] } as never
    expect(ticketFromLever('council', 'positions', 'c', { move: 'claude_takes_it', savedAt: '1' }, row)!.lanes).toEqual(['freebuff'])
    expect(ticketFromLever('council', 'positions', 'c', { move: 'claude_takes_it', savedAt: '1', lane: 'zo' }, null)!.lanes).toEqual(['claude'])
  })
  it('holds when the save or the card carries a hold', () => {
    expect(ticketFromLever('council', 'positions', 'c1', { ...pull, hold: { text: 'wait', at: 'z' } }, row)!.state).toBe('held')
    const held = { ...row, card: { ...row.card, hold: { text: 'money gate', at: 'z' } } }
    const t = ticketFromLever('council', 'positions', 'c1', pull, held)!
    expect(t.state).toBe('held')
    expect(t.brief).toContain('money gate')
  })
  it('ignores other moves and collections', () => {
    expect(ticketFromLever('council', 'positions', 'c1', { move: 'steer' }, row)).toBeNull()
    expect(ticketFromLever('council', 'questions', 'c1', pull, row)).toBeNull()
  })
  it('names the wildcard branch and says it never gates the main card', () => {
    const w = { ...row, card: { ...row.card, wildcard: { branch: 'wildcard/hum' } } }
    const t = ticketFromLever('council', 'positions', 'wild-c1-hum', pull, w)!
    expect(t.brief).toContain('wildcard/hum')
    expect(t.brief).toContain("never gates the main card's merge")
  })
})
