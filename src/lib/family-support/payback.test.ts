import assert from 'node:assert/strict'
import { coachingPace, evenMix, formatRange, PAYBACK_CHANNELS, unitsToRepay } from './payback'

// The three asks in the approved snapshot: this week, one month, 90-day ceiling.
const asks = [50_000, 220_476, 661_428]
const [hand, mailed, coaching, events] = PAYBACK_CHANNELS

assert.deepEqual(asks.map((a) => unitsToRepay(a, hand).max), [15, 65, 193], 'books sold by hand')
assert.deepEqual(asks.map((a) => unitsToRepay(a, mailed).max), [21, 92, 276], 'books mailed, shipping absorbed')
assert.deepEqual(asks.map((a) => unitsToRepay(a, coaching).max), [4, 15, 45], 'coaching sessions')
assert.deepEqual(asks.map((a) => formatRange(unitsToRepay(a, events))), ['1', '3–5', '7–14'], 'events on the sliding scale')

assert.equal(hand.lowCents, 3_440)
assert.equal(mailed.lowCents, 2_400)
assert.deepEqual([events.lowCents, events.highCents], [50_000, 100_000])

const mix = evenMix(220_476)
assert.deepEqual([mix.books.max, mix.coaching.max, formatRange(mix.events)], [22, 5, '1–2'], 'even mix, one month')

const pace = coachingPace(45)
assert.equal(pace.monthsAtOneClient, 12)
assert.equal(formatRange(pace.weeksAtCapacity), '9–12')

assert.deepEqual(unitsToRepay(0, hand), { min: 0, max: 0 }, 'nothing to repay')

console.log('payback: ok')
