import assert from 'node:assert/strict'
import { FAMILY_FINANCIAL_SNAPSHOT } from './financial-snapshot'
import { decisionAmountCents, decisionSavedNotice, dollarsToCents } from './decision-review'

const snapshot = FAMILY_FINANCIAL_SNAPSHOT

assert.equal(dollarsToCents('500'), 50_000)
assert.equal(dollarsToCents('$500'), 50_000, 'a typed dollar sign is accepted')
assert.equal(dollarsToCents(' 1,250.50 '), 125_050)
assert.equal(dollarsToCents(''), 0)
assert.equal(dollarsToCents('abc'), 0)
assert.equal(dollarsToCents('1.2.3'), 0, 'unreadable input is 0, never NaN')

assert.equal(decisionAmountCents('week', snapshot, ''), 50_000)
assert.equal(decisionAmountCents('month', snapshot, ''), 220_476)
assert.equal(decisionAmountCents('ninety', snapshot, ''), 661_428)
assert.equal(decisionAmountCents('custom', snapshot, '$750'), 75_000)
assert.equal(decisionAmountCents('no', snapshot, '$750'), 0)

assert.equal(decisionSavedNotice('month', snapshot, ''), 'Saved as a proposal for the room: Fund one month, $2,204.76.')
assert.equal(decisionSavedNotice('custom', snapshot, ''), 'Saved as a proposal for the room: Custom proposal.')
assert.equal(decisionSavedNotice('no', snapshot, ''), 'Saved for the room: No financial contribution now.')

console.log('decision-review: ok')
