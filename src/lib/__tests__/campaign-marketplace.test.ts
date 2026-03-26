import assert from 'node:assert'
import { MARKETPLACE_BASE_SLOTS, vibeulonCostForNextSlot } from '@/lib/campaign-marketplace'

assert.strictEqual(MARKETPLACE_BASE_SLOTS, 8)
assert.strictEqual(vibeulonCostForNextSlot(0), 500)
assert.strictEqual(vibeulonCostForNextSlot(1), 1000)
assert.strictEqual(vibeulonCostForNextSlot(2), 1500)
console.log('campaign-marketplace OK')
