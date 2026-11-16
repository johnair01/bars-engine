import { describe, expect, it } from 'vitest'
import { FEELINGS, PLACES, LINKS, placesFor, stuckStep, keepsakeLine, courierLine, ROBES } from '../content'
import parts from '../../../../public/between/cult/parts.json'

describe('founder gate content', () => {
  it('reads the five satisfied feelings from the move table', () => {
    expect(FEELINGS.map((f) => f.name)).toEqual(['Wonder-Excitement', 'Poignance', 'Bliss', 'Triumph', 'Peace'])
    for (const f of FEELINGS) expect(f.move.length).toBeGreaterThan(0)
  })
  it('lights at least three places for every feeling and always the register', () => {
    for (const f of FEELINGS) {
      const ps = placesFor(f.id)
      expect(ps.length).toBeGreaterThanOrEqual(3)
      expect(ps.some((p) => p.id === 'sect-gate')).toBe(true)
    }
  })
  it('reaches a real link within the three taps after the feeling', () => {
    for (const p of PLACES) expect(p.offers.some((o) => o.href || o.pay)).toBe(true)
  })
  it('uses only links from the drafts folder', () => {
    for (const p of PLACES) for (const o of p.offers) if (o.href) expect(Object.values(LINKS)).toContain(o.href)
  })
  it('offers only robes that exist in the cultivation parts', () => {
    for (const r of ROBES) expect(Object.keys(parts.outfits)).toContain(r.id)
  })
  it('names the step, the keepsake and the count', () => {
    expect(stuckStep('anger').move).toMatch(/Triumph|Breakthrough/)
    expect(keepsakeLine('anger', ['library'])).toContain('Triumph')
    expect(courierLine(12)).toBe('12 of about 300 shipped')
    expect(courierLine(null)).toBeNull()
    expect(courierLine(-1)).toBeNull()
  })
})
