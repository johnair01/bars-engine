import * as assert from 'node:assert'
import { SHENG_CYCLE, KE_CYCLE } from '../wuxing-cycles'
import * as wuxing from '../wuxing'

// Wood→Fire→Earth→Metal→Water→Wood: joy→anger→neutrality→fear→sadness→joy
assert.deepStrictEqual(SHENG_CYCLE, {
  joy: 'anger', anger: 'neutrality', neutrality: 'fear', fear: 'sadness', sadness: 'joy',
})
// Wood→Earth→Water→Fire→Metal→Wood: joy→neutrality→sadness→anger→fear→joy
assert.deepStrictEqual(KE_CYCLE, {
  joy: 'neutrality', neutrality: 'sadness', sadness: 'anger', anger: 'fear', fear: 'joy',
})
// wuxing.ts and the client share one table
assert.strictEqual(wuxing.SHENG_CYCLE, SHENG_CYCLE)
assert.strictEqual(wuxing.KE_CYCLE, KE_CYCLE)

console.log('Wuxing cycle tests passed')
