import { describe, expect, it } from 'vitest'
import { closePage } from '../page'
import { railMarks } from '../rail'
import { newClose } from '../types'

const NOW = new Date('2026-11-14T03:00:00Z')

describe('the five-mark rail', () => {
  it('always has five marks, and skipping one never shortens it', () => {
    const r = newClose('2026-11-14', [], '2026-11-14T02:50:00Z')
    expect(railMarks(r)).toHaveLength(5)
    r.skipped.push('glass'); r.move = 'unpacking'
    const marks = railMarks(r)
    expect(marks).toHaveLength(5)
    expect(marks.map(m => m.state)).toEqual(['skipped', 'now', 'not-yet', 'not-yet', 'not-yet'])
  })

  it('marks passed steps done, the current one now, the rest not yet', () => {
    const r = newClose('2026-11-14'); r.move = 'plan'
    expect(railMarks(r).map(m => m.state)).toEqual(['done', 'done', 'done', 'now', 'not-yet'])
  })

  it('shows all five finished once the close is closed, keeping skipped ones skipped', () => {
    const r = newClose('2026-11-14'); r.move = 'lever'; r.status = 'closed'; r.skipped.push('pushback')
    expect(railMarks(r).map(m => m.state)).toEqual(['done', 'done', 'skipped', 'done', 'done'])
  })

  it('draws the rail and one card, with no tab row', () => {
    const r = newClose('2026-11-14', [], '2026-11-14T02:50:00Z'); r.move = 'pushback'; r.skipped.push('unpacking')
    const html = closePage(r, 'pushback', NOW)
    expect(html.match(/<li class="mk /g)).toHaveLength(5)
    expect(html).toContain('Step 3 of 5')
    expect(html).toContain('class="mk skipped')
    expect(html.match(/<section>/g)).toHaveLength(1)
    expect(html).not.toContain('class="t ')
  })
})
