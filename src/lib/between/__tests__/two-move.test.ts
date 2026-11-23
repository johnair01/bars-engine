import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// The I Ching two-move card (Six-faces-council .specify/specs/iching-two-move): two slips from a cast, inner from the
// lower trigram and outer from the upper, each the good of its trigram's pair the charge is short of.
import { leanOf, openSlip, PAIRS, shortOf, snapshotOf, STOCK, trigramsOf, turnSlip, twoMovesFor } from '../../../../public/between/iching/two-move.js'
import { TRIGRAM_RELATIONAL_PAIR2 } from '@/lib/creator-scene-grid-deck/archetype-trigram-polarities'

const table = JSON.parse(readFileSync(join(__dirname, '../../../../public/between/iching/hexagrams.json'), 'utf8'))
const charge = { text: 'Ari is going to meet my mom.' }

describe('the two slips', () => {
  it('keeps the pairs in step with TRIGRAM_RELATIONAL_PAIR2', () => {
    for (const [t, p] of Object.entries(TRIGRAM_RELATIONAL_PAIR2)) expect(PAIRS[t as keyof typeof PAIRS]).toEqual([p.a, p.b])
  })
  it('has a stock line for every good, under 20 words, with an overdone line that starts with the good', () => {
    const goods = Object.values(PAIRS).flat()
    expect(goods).toHaveLength(16)
    for (const g of goods) {
      const s = STOCK[g as keyof typeof STOCK]
      expect(s.move.split(/\s+/).length).toBeLessThan(20)
      expect(s.overdone.startsWith(g)).toBe(true)
    }
  })
  it('gives exactly two slips for each of the 64 hexagrams: inner from the lower trigram, outer from the upper', () => {
    for (let n = 1; n <= 64; n++) {
      const h = table.hexagrams[n - 1]
      const [inner, outer] = twoMovesFor(table, n, charge)
      expect([inner.side, outer.side]).toEqual(['inner', 'outer'])
      expect(inner.trigram.toLowerCase()).toBe(h.lower)
      expect(outer.trigram.toLowerCase()).toBe(h.upper)
      for (const s of [inner, outer]) {
        expect(PAIRS[s.trigram as keyof typeof PAIRS]).toContain(s.good)
        expect(PAIRS[s.trigram as keyof typeof PAIRS]).toContain(s.otherGood)
        expect(s.good).not.toBe(s.otherGood)
        expect(s.move.length).toBeGreaterThan(10)
      }
    }
  })
  it('gives the same slips for the same hexagram and charge', () => {
    expect(twoMovesFor(table, 11, charge)).toEqual(twoMovesFor(table, 11, charge))
  })
  it('reads a named short good first, then the polarity the charge over-privileges', () => {
    expect(shortOf('Heaven', { short: 'restraint' }, 1, 'inner')).toBe('Restraint')
    expect(shortOf('Heaven', { polarity: { a: 'Spark', b: 'Restraint', over: 'Spark' } }, 1, 'inner')).toBe('Restraint')
    expect(shortOf('Heaven', { polarity: { a: 'Spark', b: 'Restraint', over: 'Restraint' } }, 1, 'inner')).toBe('Spark')
  })
  it('turns a slip to the other good of its pair and back', () => {
    const [inner] = twoMovesFor(table, 11, charge)
    const t = turnSlip(inner)
    expect(t.good).toBe(inner.otherGood)
    expect(turnSlip(t).good).toBe(inner.good)
  })
  it('reads the King Wen order, not iching-struct: 54 is Thunder over Lake', () => {
    expect(trigramsOf(table, 54)).toEqual(['Lake', 'Thunder'])
    expect(() => trigramsOf(table, 65)).toThrow()
  })
  it('keeps the lean and the provenance snapshot as the spec names them', () => {
    const [inner] = twoMovesFor(table, 13, charge)
    expect(leanOf(13, inner)).toEqual({ hexagram: 13, side: 'inner', trigram: inner.trigram, good: inner.good })
    expect(snapshotOf(13, inner, 'c1', '2026-11-08T00:00:00Z')).toEqual({ source: 'iching-two-move', hexagram: 13, side: 'inner', trigram: inner.trigram, good: inner.good, chargeId: 'c1', drawnAt: '2026-11-08T00:00:00Z' })
  })
})

describe('the lean on a kept cast (FR-006)', () => {
  const kept = { n: 11, becomes: null, lane: 'yourself', suit: 'WU', room: null, line: 'x', at: 1, done: null }
  it('takes the taken slip as a lean of side, trigram and good, and nothing else', async () => {
    const { homeWrite } = await import('@/lib/between/rules')
    const ok = (lean: unknown) => homeWrite({ casts: { c1: { ...kept, lean } } } as never)
    expect(ok({ side: 'inner', trigram: 'Heaven', good: 'Restraint' }).ok).toBe(true)
    expect(ok({ side: 'inner', trigram: 'Heaven', good: 'Nurture' }).ok).toBe(false)
    expect(ok({ side: 'inner', trigram: 'Heaven', good: 'Restraint', note: 'words' }).ok).toBe(false)
  })
})

describe('one draw per charge until met (FR-005)', () => {
  const now = Date.parse('2026-11-08T12:00:00Z'), day = 864e5
  const open = { n: 11, lean: { side: 'inner', trigram: 'Heaven', good: 'Restraint' }, at: now - day, done: null }
  it('holds the page while a taken slip is not done', () => {
    expect(openSlip([open], now)).toBe(open)
  })
  it('frees the page once the slip is done, or after a week', () => {
    expect(openSlip([{ ...open, done: now }], now)).toBeNull()
    expect(openSlip([{ ...open, at: now - 8 * day }], now)).toBeNull()
  })
  it('ignores kept casts that took no slip, and an empty page', () => {
    expect(openSlip([{ ...open, lean: undefined }], now)).toBeNull()
    expect(openSlip([], now)).toBeNull()
  })
})
