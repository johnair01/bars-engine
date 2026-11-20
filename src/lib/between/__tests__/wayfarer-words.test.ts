import { describe, expect, it } from 'vitest'
import { WAYFARERS, WAYFARER_KEYS } from '../../../../public/sect/heaven/wayfarer-words.js'
import { CLIMB_KEYS } from '../../../../public/sect/heaven/trainee-words.js'

/* The wayfarers on the guided climb (his B on tw-build-look-2, 2026-11-19). */
describe('the wayfarers on the climb', () => {
  it('stand beside four climb stops that exist, never the crown', () => {
    expect(WAYFARER_KEYS.length).toBeGreaterThanOrEqual(4)
    for (const k of WAYFARER_KEYS) { expect(CLIMB_KEYS).toContain(k); expect(k).not.toBe('crown') }
  })
  it('each has an opening line and two asks, every line under 30 words', () => {
    for (const k of WAYFARER_KEYS) {
      const w = WAYFARERS[k]
      expect(w.asks.length).toBe(2)
      for (const t of [w.open, ...w.asks.map((a: string[]) => a[1])]) { expect(t.split(/\s+/).length).toBeLessThanOrEqual(30); expect(t.length).toBeGreaterThan(20) }
      for (const a of w.asks) expect(a[0].length).toBeGreaterThan(5)
    }
  })
  it('name no face and keep no negation pairs', () => {
    const all = WAYFARER_KEYS.flatMap((k: string) => [WAYFARERS[k].open, ...WAYFARERS[k].asks.flat()])
    for (const s of all) { expect(s).not.toMatch(/\b(Shaman|Architect|Challenger|Regent|Diplomat|Sage)\b/); expect(s).not.toMatch(/\bnot\b.*\bbut\b/i) }
  })
})
