/**
 * Myths Read scorer — §4 scoring, tie-breaks, floor rule, strength labels.
 * Spec: design_handoff_myths_read/logic_spec_reference.md §4.
 */
import { describe, it, expect } from 'vitest'
import { scoreMythRead, strengthLabel, QUIZ_ITEMS, MYTHS, SURFACE_FLOOR } from '../myths-read'

/** Answer every item 0 except the given overrides. */
function answers(over: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {}
  for (const item of QUIZ_ITEMS) base[item.id] = 0
  return { ...base, ...over }
}

describe('scoreMythRead', () => {
  it('all-zero: floor rule still surfaces exactly one myth', () => {
    const { surfaced, ranked } = scoreMythRead(answers({}))
    expect(ranked).toHaveLength(10)
    expect(surfaced).toHaveLength(1) // rank 1 always kept, even at pct 0
  })

  it('pct is normalized per myth (single-item myth maxed → 1.0)', () => {
    const { ranked } = scoreMythRead(answers({ q2: 4 })) // q2 → M2 only
    const m2 = ranked.find((r) => r.myth === 'M2')!
    expect(m2.pct).toBe(1)
    expect(m2.raw).toBe(4)
  })

  it('a myth loaded by a full + a cross-load item has denominator 6 (M1: q1+q10½)', () => {
    // q1 maxed but q10 zero → raw 4, max 4 + 2 = 6 → pct 2/3
    const m1 = scoreMythRead(answers({ q1: 4 })).ranked.find((r) => r.myth === 'M1')!
    expect(m1.pct).toBeCloseTo(2 / 3, 6)
  })

  it('double-loaded myth (M8: q8+q9) normalizes across both items', () => {
    // one of two items maxed → raw 4, max 8 → pct 0.5
    const half = scoreMythRead(answers({ q8: 4 })).ranked.find((r) => r.myth === 'M8')!
    expect(half.pct).toBe(0.5)
    const full = scoreMythRead(answers({ q8: 4, q9: 4 })).ranked.find((r) => r.myth === 'M8')!
    expect(full.pct).toBe(1)
  })

  it('cross-load: q10 feeds M9 fully and M1 at half weight', () => {
    const { ranked } = scoreMythRead(answers({ q10: 4 }))
    const m9 = ranked.find((r) => r.myth === 'M9')!
    const m1 = ranked.find((r) => r.myth === 'M1')!
    expect(m9.pct).toBe(1) // 4×1.0 / (4×1.0), M9 only loaded by q10
    expect(m1.pct).toBeCloseTo(1 / 3, 6) // raw 4×0.5=2, max q1(4)+q10(2)=6 → 1/3
  })

  it('floor rule: rank 2/3 dropped when below the 0.40 floor', () => {
    // M1 maxed (pct 1.0); M2 barely registers (pct 0.25 < floor)
    const { surfaced } = scoreMythRead(answers({ q1: 4, q2: 1 }))
    expect(surfaced.map((s) => s.myth)).toEqual(['M1'])
    expect(SURFACE_FLOOR).toBe(0.4)
  })

  it('surfaces up to three myths above the floor', () => {
    const { surfaced } = scoreMythRead(answers({ q1: 4, q2: 4, q3: 4, q4: 4 }))
    expect(surfaced).toHaveLength(3)
  })

  it('tie-break falls to canonical order (M8 before M2 when tied)', () => {
    // M2 (q2) and M8 (q8+q9) both fully maxed → both pct 1.0, equal peak 4.
    const { ranked } = scoreMythRead(answers({ q2: 4, q8: 4, q9: 4 }))
    const m8Index = ranked.findIndex((r) => r.myth === 'M8')
    const m2Index = ranked.findIndex((r) => r.myth === 'M2')
    expect(m8Index).toBeLessThan(m2Index) // M8 precedes M2 in canonical order
  })

  it('derives root beliefs from surfaced myths (deduped)', () => {
    // M5 (q5) and M10 (q11) both root to not_worthy → single entry
    const { rootBeliefs, surfaced } = scoreMythRead(answers({ q5: 4, q11: 4 }))
    expect(surfaced.map((s) => s.myth).sort()).toEqual(['M10', 'M5'])
    expect(rootBeliefs).toEqual(['not_worthy'])
  })

  it('clamps out-of-range answer values (M2, single-loaded)', () => {
    const { ranked } = scoreMythRead(answers({ q2: 99 }))
    expect(ranked.find((r) => r.myth === 'M2')!.pct).toBe(1)
  })
})

describe('strengthLabel', () => {
  it('maps pct to Loud / Clear / Faint at the spec thresholds', () => {
    expect(strengthLabel(0.72)).toBe('Loud')
    expect(strengthLabel(0.71)).toBe('Clear')
    expect(strengthLabel(0.55)).toBe('Clear')
    expect(strengthLabel(0.54)).toBe('Faint')
    expect(strengthLabel(0)).toBe('Faint')
  })
})

describe('content integrity', () => {
  it('every item weights only known myths', () => {
    for (const item of QUIZ_ITEMS) {
      for (const myth of Object.keys(item.weights)) {
        expect(MYTHS[myth as keyof typeof MYTHS]).toBeDefined()
      }
    }
  })
})
