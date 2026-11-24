import { describe, expect, it } from 'vitest'
import { ARRIVAL, FACES, MAX_CHARS, SPIRIT_ASKS, SPIRIT_SKIP, clean, sheet, nextAsk } from '../../../../public/sect/heaven/arrival-words.js'

/* The founder's two-line arrival card and the spirits' sheet lines (his B on bhq-arrival-1, 2026-11-21). */
describe('the arrival card words', () => {
  it('offers the six faces and asks for home face and quest only', () => {
    expect(FACES.map(f => f[0])).toEqual(['Shaman', 'Architect', 'Challenger', 'Regent', 'Diplomat', 'Sage'])
    expect(ARRIVAL.face).not.toMatch(/\bface\b/)
    expect(ARRIVAL.face).toMatch(/like you/)
    expect(ARRIVAL.quest).toMatch(/own words/)
    expect(ARRIVAL.later).toMatch(/Shadow and myth/)
  })
  it('lets every line be skipped', () => {
    expect(ARRIVAL.skip).toBeTruthy()
    expect(SPIRIT_SKIP).toBeTruthy()
  })
  it('keeps only known, cleaned sheet lines', () => {
    expect(sheet({ face: 'Sage', quest: '  walk  \n on ', shadow: '', junk: 'x' })).toEqual({ face: 'Sage', quest: 'walk on' })
    expect(sheet({ face: 'Wizard' })).toEqual({})
    expect(sheet(null)).toEqual({})
    expect(clean('x'.repeat(500)).length).toBe(MAX_CHARS)
  })
  it('asks shadow first, then myth, then nothing', () => {
    expect(nextAsk({})).toBe('shadow')
    expect(nextAsk({ shadow: 'a' })).toBe('myth')
    expect(nextAsk({ shadow: 'a', myth: 'b' })).toBe('')
    expect(Object.keys(SPIRIT_ASKS)).toEqual(['shadow', 'myth'])
  })
  it('keeps every line under 30 words with no negation pairs', () => {
    const all = [...Object.values(ARRIVAL), ...FACES.map(f => f[1]), ...Object.values(SPIRIT_ASKS).flatMap(a => [a.ask, a.label, a.keep])]
    for (const s of all) {
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(30)
      expect(s).not.toMatch(/\bnot [^.]*, (you're|you are|but)\b/i)
    }
  })
})
