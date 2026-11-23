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

/* Step 3: the 3-2-1 at the chosen spirit (plan heaven-quest-demo step 3). */
import { STAND_NAMES, STAND_ORDER, STEP, NEED, stepsFor } from '../../../../public/sect/heaven/doubt-words.js'
describe('the 3-2-1 at a spirit', () => {
  const steps = stepsFor('I am not good enough')
  it('runs Face it (3 lines), Talk to it (4), Be it (3), the player writing every line', () => {
    expect(STAND_ORDER).toEqual(['face', 'talk', 'be'])
    expect(STAND_ORDER.map(k => STAND_NAMES[k as 'face'])).toEqual(['Face it', 'Talk to it', 'Be it'])
    expect(steps.face).toHaveLength(3); expect(steps.talk).toHaveLength(4); expect(steps.be).toHaveLength(3)
    expect(steps.face[0].ask).toContain('I am not good enough')
  })
  it('names the voice, never a face, in every line, with no negation pairs, and every line under 30 words', () => {
    const all = [...Object.values(steps).flat().map(s => s.ask), NEED.ask, NEED.gift('x'), NEED.met, STEP.enough]
    for (const s of all) {
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(30)
      expect(s).not.toMatch(/\b(Shaman|Architect|Challenger|Regent|Diplomat|Sage)\b/)
      expect(s).not.toMatch(/\bnot [^.]*, (you're|you are|but)\b/i)
    }
    for (const st of Object.values(steps).flat()) expect(['you', 'it']).toContain(st.voice)
  })
  it('ends Be it on the gift the voice gives back', () => { expect(steps.be[2].ask).toMatch(/give back/) })
})
