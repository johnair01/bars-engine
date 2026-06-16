import assert from 'node:assert'
import {
  buildRaisedCents,
  keepBuildingAfterWall,
  BARN_WALLS,
  type BarnState,
} from '../barn-raising'

const targetCentsFor = (key: 'car' | 'presale' | 'runway') =>
  BARN_WALLS.find((w) => w.key === key)!.targetCents

// dollars → cents per wall (currentValue is stored in dollars; bar wants cents)
const raised = buildRaisedCents([
  { wallKey: 'car', currentValue: 52 }, // $52 → 5200c
  { wallKey: 'presale', currentValue: 18.5 }, // $18.50 → 1850c
  { wallKey: 'runway', currentValue: 8.4 }, // $8.40 → 840c
  { wallKey: 'unknown', currentValue: 999 }, // ignored
  { wallKey: null, currentValue: 5 }, // ignored
])
assert.strictEqual(raised.car, 5200, 'car cents')
assert.strictEqual(raised.presale, 1850, 'presale cents')
assert.strictEqual(raised.runway, 840, 'runway cents')

// rounding (avoid float drift)
assert.strictEqual(buildRaisedCents([{ wallKey: 'car', currentValue: 0.1 }]).car, 10)
assert.strictEqual(buildRaisedCents([{ wallKey: 'car', currentValue: 12.345 }]).car, 1235)

// empty → all zero
assert.deepStrictEqual(buildRaisedCents([]), { car: 0, presale: 0, runway: 0 })

console.log('✓ barn-raising buildRaisedCents tests passed')

// --- keepBuildingAfterWall (FR6) ---

// Wall not full yet → no redirect.
const partial: BarnState = { raisedCents: { car: 100, presale: 0, runway: 0 }, hands: 0, beams: 0 }
assert.strictEqual(keepBuildingAfterWall(partial, 'car'), null, 'partial wall → null')

// Car full (others empty) → guidance points to the other open walls first, then in-kind, then access.
const carDone: BarnState = {
  raisedCents: { car: targetCentsFor('car'), presale: 0, runway: 0 },
  hands: 0,
  beams: 0,
}
const g = keepBuildingAfterWall(carDone, 'car')
assert.ok(g, 'car full → guidance')
assert.strictEqual(g!.completedWallKey, 'car')
assert.strictEqual(g!.actions.length, 3, 'capped at 3 actions')
// First action is the next open wall (pre-sale), not the completed one.
assert.ok(g!.actions[0].href.includes('/pricing'), 'first action = pre-sale (next open wall)')
assert.ok(!g!.actions.some((a) => a.href.includes('wall=car')), 'no link back to the full wall')

// All walls full → no cross-wall links, falls through to in-kind + access only.
const allDone: BarnState = {
  raisedCents: {
    car: targetCentsFor('car'),
    presale: targetCentsFor('presale'),
    runway: targetCentsFor('runway'),
  },
  hands: 0,
  beams: 0,
}
const g2 = keepBuildingAfterWall(allDone, 'presale')
assert.ok(g2, 'all full → still guidance (in-kind + access)')
assert.strictEqual(g2!.actions.length, 2, 'only in-kind + access remain')
assert.ok(g2!.actions.some((a) => a.href.includes('dswPath=time')), 'in-kind action present')
assert.ok(g2!.actions.some((a) => a.href.includes('/game')), 'access action present')

console.log('✓ barn-raising keepBuildingAfterWall tests passed')
