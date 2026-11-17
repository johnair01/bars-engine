import { describe, expect, it } from 'vitest'
import { thenText, ticketFromAnswer, type RowDoc } from '../ticket'

/** A row may carry its brief as a mapping keyed by answer or as a list of steps. ticketFromAnswer used to interpolate
 * it straight into the brief, so a lane read `[object Object]` (council position bf-card-brief-lands-object-object). */
const mapping = { then: { A: 'Voices first.', B: 'Tasks first, then the voices.' } } as RowDoc
const list = { options: [{ v: 'A', then: ['Write the card.', 'Build it.'] }] } as RowDoc

describe('thenText', () => {
  it('keeps a string as it stands, writes a list one step per line and nothing for no brief', () => {
    expect(thenText('Run round 3.')).toBe('Run round 3.')
    expect(thenText(['Write the card.', 'Build it.'])).toBe('Write the card.\nBuild it.')
    expect(thenText(null)).toBe('')
    expect(thenText(undefined, 'A')).toBe('')
  })
  it("writes the chosen answer's brief, and every key when his answer is not in the mapping", () => {
    expect(thenText(mapping.then, 'B')).toBe('Tasks first, then the voices.')
    expect(thenText(mapping.then)).toBe('A: Voices first.\n\nB: Tasks first, then the voices.')
    expect(thenText(mapping.then, 'C')).toBe('A: Voices first.\n\nB: Tasks first, then the voices.')
  })
})

describe('ticketFromAnswer with a mapping or a list', () => {
  it('carries the chosen brief as text and never [object Object]', () => {
    const chosen = ticketFromAnswer('council', 'questions', 'lr-day-look-3', { choice: 'A' }, mapping)!
    expect(chosen.brief).toContain('Voices first.')
    expect(chosen.brief).not.toContain('Tasks first')
    expect(chosen.brief).not.toContain('[object Object]')
    const other = ticketFromAnswer('council', 'questions', 'lr-day-look-3', { choice: 'C' }, mapping)!
    expect(other.brief).toContain('A: Voices first.')
    expect(other.brief).toContain('B: Tasks first, then the voices.')
    expect(other.brief).not.toContain('[object Object]')
  })
  it("writes the chosen option's list one step per line", () => {
    const t = ticketFromAnswer('council', 'questions', 'q1', { choice: 'A' }, list)!
    expect(t.brief).toContain('Write the card.\nBuild it.')
  })
})
