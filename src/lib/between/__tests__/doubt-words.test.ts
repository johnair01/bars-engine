import { describe, expect, it } from 'vitest'
import { DOUBT, SLIP, SPIRIT, MAX_LINES, MAX_CHARS, clean, keep, promptAt } from '../../../../public/sect/heaven/doubt-words.js'

/* The doubt card, slip and spirit cards (heaven-quest-demo step 2; his answers on hq-spirits-1 and hq-source-1, 2026-11-17). */
describe('the doubt card words', () => {
  it('starts with a blank line: no example, no prefilled words', () => {
    expect(promptAt(0)).toBe(DOUBT.ask)
    expect(promptAt(1)).toBe(DOUBT.more)
    expect(DOUBT.ask).not.toMatch(/e\.g\.|for example|such as/i)
  })
  it('keeps at most four cleaned lines and drops empties', () => {
    expect(MAX_LINES).toBe(4)
    expect(keep(['  I am  not\n good enough ', '', 'b', 'c', 'd', 'e'])).toEqual(['I am not good enough', 'b', 'c', 'd'])
    expect(keep(null)).toEqual([])
    expect(clean('x'.repeat(500)).length).toBe(MAX_CHARS)
  })
  it('credits the source by the four authors on his A, and lists the three steps', () => {
    expect(SLIP.source).toMatch(/Integral Life Practice/)
    for (const a of ['Wilber', 'Patten', 'Leonard', 'Morelli']) expect(SLIP.source).toContain(a)
    expect(SLIP.steps).toEqual(['Face the voice.', 'Talk to the voice.', 'Be the voice.'])
  })
  it('keeps every line under 30 words, names no face, and keeps no negation pairs', () => {
    const all = [DOUBT.ask, DOUBT.more, SLIP.hand, SLIP.source, SLIP.hint, SPIRIT.caption, ...SLIP.steps]
    for (const s of all) {
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(30)
      expect(s).not.toMatch(/\b(Shaman|Architect|Challenger|Regent|Diplomat|Sage)\b/)
      expect(s).not.toMatch(/\bnot [^.]*, (you're|you are|but)\b/i)
    }
  })
})
