import { describe, expect, it } from 'vitest'
import { LINES, SENSATIONS, readBack, entryLine, stoneLine, TEAM, endLine, CLIMB, CLIMB_KEYS, climbIntro } from '../../../../public/sect/heaven/trainee-words.js'

/* The trainee walk in the Heaven sect (council pass trainee-walk-three-beats_2026-11-17; his C on tw-readback-look-1). */
const all = [...Object.values(LINES), readBack('to call my brother'), readBack(''), entryLine('to call my brother'), entryLine(''), stoneLine(0), stoneLine(1), stoneLine(3), TEAM, climbIntro('to call my brother'), climbIntro(''), ...CLIMB.map(c => c.hint + ' ' + c.said), endLine('to call my brother'), endLine('')]
describe('the guided climb', () => {
  it('runs seven stops from the bell to the crown, with unique keys for the ?stop= hook', () => {
    expect(CLIMB_KEYS).toEqual(['bell', 'stair', 'landing', 'gate', 'bridge', 'road', 'crown'])
    expect(new Set(CLIMB_KEYS).size).toBe(CLIMB.length)
  })
  it('gives every stop a hint of ten words or fewer and an arrival line (the last hands over to the Elders)', () => {
    for (const c of CLIMB) { expect(c.hint.split(/\s+/).length).toBeLessThanOrEqual(10); if (c.key !== 'crown') expect(c.said.length).toBeGreaterThan(0) }
  })
})
describe('the trainee walk words', () => {
  it('gives five Elders one line each of ten words or fewer', () => {
    expect(Object.keys(LINES)).toEqual(['challenger', 'architect', 'regent', 'diplomat', 'sage'])
    for (const l of Object.values(LINES)) expect(l.split(/\s+/).length).toBeLessThanOrEqual(10)
  })
  it('reads the want back in the words he picked, and has a line for a player with no want', () => {
    expect(readBack('to call my brother')).toBe('We heard you: to call my brother. The sect names you Initiate. Your first work waits at the heart stone.')
    expect(readBack('')).toBe('We heard you. The sect names you Initiate. Your first work waits at the heart stone.')
    expect(entryLine('to call my brother')).toBe("You came wanting to call my brother. The Elders are waiting in the founder's hall.")
    expect(entryLine('')).toBe("The Elders are waiting in the founder's hall.")
  })
  it('offers the four sensations and names no Elder or person on screen', () => {
    expect(SENSATIONS).toHaveLength(4)
    for (const s of all) expect(s).not.toMatch(/\b(Shaman|Architect|Challenger|Regent|Diplomat|Sage)\b/)
  })
  it('keeps the copy plain: no negation pairs and no sentence ending in an "and" clause', () => {
    for (const s of all) {
      expect(s).not.toMatch(/\bnot [^.]*, (you're|you are|but)\b/i)
      for (const sentence of s.split(/(?<=[.!?])\s+/)) expect(sentence).not.toMatch(/, and [^.]*\.$/)
    }
  })
})
