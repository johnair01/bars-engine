import assert from 'node:assert'
import {
  mergeBruisedBananaHouseGoalData,
  parseHouseGoalData,
  isBruisedBananaHouseInstance,
} from '../bruised-banana-house-state'

const merged = mergeBruisedBananaHouseGoalData(null, { operatorNote: 'Kitchen OK', healthSignal: 4 })
const parsed = parseHouseGoalData(merged)
assert.strictEqual(parsed.house?.operatorNote, 'Kitchen OK')
assert.strictEqual(parsed.house?.healthSignal, 4)
assert.strictEqual(parsed.schema, 'bruised-banana-house-state-v1')

const merged2 = mergeBruisedBananaHouseGoalData(merged, { operatorNote: 'Bins full' })
const parsed2 = parseHouseGoalData(merged2)
assert.strictEqual(parsed2.house?.operatorNote, 'Bins full')
assert.strictEqual(parsed2.house?.healthSignal, 4, 'health preserved when omitted from patch')

const merged3 = mergeBruisedBananaHouseGoalData(merged2, { operatorNote: '', healthSignal: null })
const parsed3 = parseHouseGoalData(merged3)
assert.strictEqual(parsed3.house?.operatorNote, undefined)
assert.strictEqual(parsed3.house?.healthSignal, null)

assert.strictEqual(isBruisedBananaHouseInstance('bruised-banana-house', null), true)
assert.strictEqual(isBruisedBananaHouseInstance('other', 'bruised-banana-house'), true)
assert.strictEqual(isBruisedBananaHouseInstance('other', 'bruised-banana'), false)

console.log('bruised-banana-house-state: OK')
