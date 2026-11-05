import { describe, expect, it } from 'vitest'
// The lantern table's hand (bars-engine .specify/specs/lantern-table/spec.md): lh-hand-basic, lh-hand-share, lh-buy-cap,
// lh-bar-mint, lh-block-victory and the payout sliders. The play-through cases are falsify-sim.ts's runs C, D and E,
// played on the engine's own moves.
import { apply, blockLeft, BUY_CAP, CMD, cmdNeed, init, KEEPS, nHeld, payout, payoutShare, type Move, type State } from '../engine'

const UNTAGGED = { res: [true, true, true, true, true, true], tags: [{}, {}, {}, {}, {}, {}] }
const zeroOil = (s: State): State => ({ ...JSON.parse(JSON.stringify(s)), oil: 0 })
const chOf = (s: State, i: number) => s.keeps[i].loops.find(l => l.g > 0)?.ch ?? KEEPS[i].pred

describe('the basic move (lh-hand-basic)', () => {
  it('costs 1 oil and strikes for 1 whatever its kind', () => {
    const s0 = init(UNTAGGED)
    for (const kind of ['Ask', 'Ground', 'Evidence'] as const) {
      const s = apply(s0, { w: 1, type: 'basic', keep: 1, ch: 'earth', kind })
      expect(s.oil).toBe(3)
      expect(s.keeps[1].loops[0].g).toBe(1)
    }
  })

  it('is refused when the oil is out', () => {
    const s = apply(zeroOil(init(UNTAGGED)), { w: 1, type: 'basic', keep: 1, ch: 'earth' })
    expect(s.keeps[1].loops[0].g).toBe(2)
    expect(s.fx).toMatch(/oil is out/)
  })
})

describe('the vibeulon purchase (lh-hand-basic, lh-buy-cap)', () => {
  it('buys one basic move only when the oil is 0', () => {
    const s0 = { ...init(UNTAGGED), vibeulons: 2 }
    const early = apply(s0, { w: 1, type: 'buy', keep: 1, ch: 'earth' })
    expect(early.vibeulons).toBe(2)
    expect(early.keeps[1].loops[0].g).toBe(2)
    const late = apply(zeroOil(s0), { w: 1, type: 'buy', keep: 1, ch: 'earth' })
    expect(late.vibeulons).toBe(1)
    expect(late.keeps[1].loops[0].g).toBe(1)
  })

  it('refuses a fifth purchase in one watch, and the cap resets when the watch turns', () => {
    let s: State = { ...zeroOil(init(UNTAGGED)), vibeulons: 8 }
    for (let k = 0; k < BUY_CAP + 1; k++) s = apply(s, { w: 1, type: 'buy', keep: 1 + (k % 5), ch: chOf(s, 1 + (k % 5)) })
    expect(s.bought).toBe(4)
    expect(s.vibeulons).toBe(4)
    expect(s.fx).toMatch(/bought 4 moves this watch/)
    s = apply(s, { w: 2, type: 'read' })
    expect(s.bought).toBe(0)
    expect(s.oil).toBe(4)
  })

  it('refuses when there is no vibeulon', () => {
    const s = apply(zeroOil(init(UNTAGGED)), { w: 1, type: 'buy', keep: 1, ch: 'earth' })
    expect(s.fx).toMatch(/no vibeulons/)
  })
})

describe('the BAR mint (lh-bar-mint)', () => {
  it('a BAR mints a vibeulon that buys a basic move at the same table', () => {
    let s = init(UNTAGGED)
    s = apply(s, { w: 1, type: 'story', keep: 3, ch: 'metal', kind: 'Evidence' })
    expect(s.vibeulons).toBe(1)
    s = zeroOil(s)
    s = apply(s, { w: 1, type: 'buy', keep: 5, ch: 'water' })
    expect(s.vibeulons).toBe(0)
    expect(s.keeps[5].loops[0].g).toBe(1)
  })
})

describe('the payout share (lh-hand-share)', () => {
  it('weighs a BAR refinement 2 and a basic refinement 1', () => {
    let s = init(UNTAGGED)
    s = apply(s, { w: 1, type: 'story', keep: 3, ch: 'metal', kind: 'Evidence', who: 'Ana' })   // matched: 2 refinements
    s = apply(s, { w: 1, type: 'basic', keep: 5, ch: 'water', who: 'Ben' })                    // 1 refinement
    expect(s.share).toEqual({ Ana: 4, Ben: 1 })
    expect(payoutShare(s)).toEqual({ Ana: 0.8, Ben: 0.2 })
  })

  it('an unmatched BAR still weighs 2 for its one refinement', () => {
    const s = apply(init(UNTAGGED), { w: 1, type: 'story', keep: 3, ch: 'metal', kind: 'Ask' })
    expect(s.share).toEqual({ You: 2 })
  })

  it('is empty before anything is dealt', () => expect(payoutShare(init(UNTAGGED))).toEqual({}))
})

describe('minor wins and the round (lh-block-victory)', () => {
  it('marks a block found when a fogged keep surfaces, and a keep dissolved when it is held', () => {
    let s = init({ res: [true, true, true, false, true, true], tags: [{}, {}, {}, {}, {}, {}] })
    s = apply(s, { w: 1, type: 'basic', keep: 3, ch: 'metal' })
    expect(s.wins).toContainEqual({ type: 'found', i: 3, w: 1, ch: 'metal' })
    s = apply(s, { w: 1, type: 'basic', keep: 3, ch: 'metal' })
    expect(s.keeps[3].held).toBe(true)
    expect(s.wins).toContainEqual({ type: 'dissolved', i: 3, w: 1 })
    expect(s.done).toBe(false)
  })

  it('ends the round when every emerged keep has dissolved, leaving fogged keeps out', () => {
    const s = playOut(init({ res: [true, true, false, false, false, false], tags: [{}, {}, {}, {}, {}, {}] }), 'bar', 0)
    expect(s.state.done).toBe(true)
    expect(s.state.keeps[2].fog).toBe(true)
  })
})

describe('the sliders (lh-payout-sliders, lh-block-size)', () => {
  it('set the block size and the payout; the middle deals the untagged 12', () => {
    expect(payout({ size: 2, charge: 2, deadline: 2 })).toEqual({ blockSize: 12, vibeulons: 15 })
    expect(payout({ size: 1, charge: 1, deadline: 1 }).blockSize).toBe(6)
    expect(payout({ size: 3, charge: 3, deadline: 3 }).blockSize).toBe(18)
    expect(payout({ size: 3, charge: 3, deadline: 3 }).vibeulons).toBeGreaterThan(payout({ size: 3, charge: 3, deadline: 1 }).vibeulons)
  })

  it('init scales the block to the sliders, each loop between 1 and 3', () => {
    for (const sl of [{ size: 1, charge: 1, deadline: 1 }, { size: 3, charge: 2, deadline: 3 }] as const) {
      const { blockSize } = payout(sl)
      const s = init(UNTAGGED, { blockSize })
      expect(blockLeft(s)).toBe(blockSize)
      s.keeps.forEach(k => k.loops.forEach(l => { expect(l.g).toBeGreaterThanOrEqual(1); expect(l.g).toBeLessThanOrEqual(3) }))
    }
  })
})

/** Play a table out as falsify-sim.ts does: hit the weakest open keep, oil first, then vibeulons. */
function playOut(start: State, hand: 'bar' | 'basic', bank: number) {
  let s: State = { ...start, vibeulons: bank }
  let clearedIn = 0, oilSpent = 0, bought = 0
  for (let w = 1; w <= 20 && blockLeft(s) > 0; w++) {
    if (w > 1) s = apply(s, { w, type: 'read' })
    for (;;) {
      const open = s.keeps.map((_, i) => i).filter(i => !s.keeps[i].held && !s.keeps[i].fog && (i !== CMD || nHeld(s) >= cmdNeed(s)))
      const left = (i: number) => s.keeps[i].loops.reduce((a, l) => a + l.g, 0)
      const i = open.sort((a, b) => left(a) - left(b))[0]
      if (i === undefined) break
      const ch = chOf(s, i)
      let m: Move
      if (s.oil > 0) m = hand === 'bar' ? { w, type: 'story', keep: i, ch, kind: KEEPS[i].kind, withWitness: true } : { w, type: 'basic', keep: i, ch }
      else m = { w, type: 'buy', keep: i, ch }
      const next = apply(s, m)
      if (next.oil === s.oil && next.vibeulons === s.vibeulons) break   // refused: out of oil and out of purchases
      if (next.oil < s.oil) oilSpent++; else bought++
      s = next
      if (blockLeft(s) === 0) break
    }
    if (blockLeft(s) === 0) { clearedIn = w; break }
    s = apply(s, { w, type: 'tick' })
  }
  return { state: s, clearedIn, oilSpent, bought }
}

describe('falsify-sim runs on the engine (lh-buy-cap, lh-bar-mint)', () => {
  it('C: a matched-BAR player spending its mint clears the 12 block in one watch on 4 oil and 4 bought moves', () => {
    const r = playOut(init(UNTAGGED), 'bar', 0)
    expect(r).toMatchObject({ clearedIn: 1, oilSpent: 4, bought: 4 })
    expect(r.state.done).toBe(true)
  })

  it('D, with the cap: a basic player with 8 banked vibeulons can no longer clear in one watch', () => {
    const r = playOut(init(UNTAGGED), 'basic', 8)
    expect(r.clearedIn).toBeGreaterThan(1)
  })

  it('E: the same player under the cap of 4 a watch takes two watches', () => {
    const r = playOut(init(UNTAGGED), 'basic', 8)
    expect(r.clearedIn).toBe(2)
    expect(r.oilSpent).toBe(8)
  })
})
