import { describe, expect, it } from 'vitest'
import { ticketFromAnswer } from '../ticket'
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
    expect(t.brief).toContain('python3 board/gates.py wq-look-3 --line')
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
