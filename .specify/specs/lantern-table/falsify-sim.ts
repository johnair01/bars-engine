/**
 * Falsify run for the lantern table (spec.md, "How we will know it failed").
 *
 * Plays the hand positions on top of the merged engine (src/lib/lantern/engine.ts, #505): `strike` and the `tick`
 * move are the engine's own; the basic move, the vibeulon purchase and the weighted share are the positions this spec
 * adds (lh-hand-basic, lh-hand-share), written here the way the build will write them.
 *
 * Run: node --experimental-strip-types .specify/specs/lantern-table/falsify-sim.ts
 */
import { init, strike, apply, blockLeft, nHeld, cmdNeed, KEEPS, CMD, type State } from '../../../src/lib/lantern/engine.ts'

type Hand = 'bar' | 'basic'
interface Run { label: string; hand: Hand; spendMint: boolean; bank: number; cap: number | null }

// Six reservations on, untagged: each keep plays a placeholder loop at strength 2, so the block starts at 12.
const INTAKE = { res: [true, true, true, true, true, true], tags: [{}, {}, {}, {}, {}, {}] }

function target(s: State): number {
  const open = s.keeps.map((k, i) => i).filter(i => !s.keeps[i].held && !s.keeps[i].fog)
  const ok = open.filter(i => i !== CMD || nHeld(s) >= cmdNeed(s))
  const left = (i: number) => s.keeps[i].loops.reduce((a, l) => a + l.g, 0)
  return ok.sort((a, b) => left(a) - left(b))[0]
}

function play(r: Run) {
  let s = init(INTAKE)
  let vib = r.bank, minted = 0, bought = 0, oilSpent = 0
  const weight: Record<Hand, number> = { bar: 0, basic: 0 }
  const strikes: Record<Hand, number> = { bar: 0, basic: 0 }
  let clearedIn = 0, maxBoughtInWatch = 0
  for (let w = 1; w <= 20 && blockLeft(s) > 0; w++) {
    if (w > 1) { s.w = w; s.oil = 4; s.keeps.forEach(k => { k.touched = false }) }
    let boughtThisWatch = 0
    while (blockLeft(s) > 0) {
      const i = target(s)
      if (i === undefined) break
      const ch = s.keeps[i].loops.find(l => l.g > 0)!.ch
      if (s.oil > 0) {
        s.oil--; oilSpent++
        if (r.hand === 'bar') {           // matched BAR: 1 oil, strikes 2, mints 1 vibeulon (engine `story`)
          strike(s, i, 2, ch, 'bar'); weight.bar += 2 * 2; strikes.bar += 2; minted++
          if (r.spendMint) vib++
        } else {                          // basic: 1 oil, strikes 1 whatever its kind
          strike(s, i, 1, ch, 'basic'); weight.basic += 1; strikes.basic += 1
        }
      } else if (vib > 0 && (r.cap === null || boughtThisWatch < r.cap)) {
        vib--; bought++; boughtThisWatch++  // a vibeulon buys a basic move, only at 0 oil
        strike(s, i, 1, ch, 'basic'); weight.basic += 1; strikes.basic += 1
      } else break
    }
    maxBoughtInWatch = Math.max(maxBoughtInWatch, boughtThisWatch)
    if (blockLeft(s) === 0) { clearedIn = w; break }
    s = apply(s, { w, type: 'tick' })
  }
  return { ...r, clearedIn, oilSpent, bought, maxBoughtInWatch, minted, strikes, weight,
    strikesPerOil: +((strikes.bar + strikes.basic) / oilSpent).toFixed(2) }
}

const runs: Run[] = [
  { label: 'A matched-BAR player, no purchases', hand: 'bar', spendMint: false, bank: 0, cap: null },
  { label: 'B basic player, no purchases', hand: 'basic', spendMint: false, bank: 0, cap: null },
  { label: 'C matched-BAR player, spends its minted vibeulons', hand: 'bar', spendMint: true, bank: 0, cap: null },
  { label: 'D basic player, 8 saved vibeulons, no cap', hand: 'basic', spendMint: false, bank: 8, cap: null },
  { label: 'E basic player, 8 saved vibeulons, cap 4 a watch', hand: 'basic', spendMint: false, bank: 8, cap: 4 },
  { label: 'F matched-BAR player, spends mint, cap 4 a watch', hand: 'bar', spendMint: true, bank: 0, cap: 4 },
]
console.log('block at deal:', blockLeft(init(INTAKE)), 'refinements; keeps:', KEEPS.length)
for (const r of runs) console.log(JSON.stringify(play(r)))

// Per oil spent, one watch, one keep each: the value of a move to its player.
const perOil = {
  basic: { strikes: 1, weight: 1 },
  matchedBar: { strikes: 2, weight: 4 },                 // 2 refinements, each weighs 2
  matchedBarPlusMint: { strikes: 3, weight: 5 },         // plus the minted vibeulon spent on a basic move
  unmatchedBar: { strikes: 1, weight: 2 },
}
console.log('per oil:', JSON.stringify(perOil))
