import assert from 'node:assert'
import { buildRaisedCents } from '../barn-raising'

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
