import * as assert from 'node:assert'
import type { EmotionChannel } from '../types'
import {
  findCompoundSlotsForChannel,
  findCompoundSlotsForPair,
  getCompoundEmotionSlot,
  listCompoundEmotionSlots,
  resolveCompoundEmotion,
} from '../compound-emotions'

const slots = listCompoundEmotionSlots()
const channels: EmotionChannel[] = ['fear', 'sadness', 'joy', 'anger', 'neutrality']

assert.strictEqual(slots.length, 20, 'the lattice has 20 directional slots')
assert.strictEqual(new Set(slots.map((slot) => slot.id)).size, slots.length, 'slot ids are unique')

const pairKeys = new Set(
  slots.map((slot) => [...slot.channels].sort().join('__')),
)
assert.strictEqual(pairKeys.size, 10, 'the lattice has 10 unordered channel pairs')

for (const pairKey of pairKeys) {
  const [a, b] = pairKey.split('__') as [EmotionChannel, EmotionChannel]
  assert.strictEqual(findCompoundSlotsForPair(a, b).length, 2, `${pairKey} has two directions`)
}

for (const channel of channels) {
  const channelSlots = findCompoundSlotsForChannel(channel)
  const channelPairs = new Set(channelSlots.map((slot) => [...slot.channels].sort().join('__')))
  assert.strictEqual(channelPairs.size, 4, `${channel} participates in four edges`)
  assert.strictEqual(channelSlots.length, 8, `${channel} participates in eight directional slots`)
}

const named = slots.filter((slot) => slot.nameStatus === 'named').map((slot) => slot.label).sort()
assert.deepStrictEqual(named, ['Disappointment', 'Disgust', 'Dread'])
assert.strictEqual(slots.filter((slot) => slot.nameStatus === 'candidate').length, 17)

assert.strictEqual(getCompoundEmotionSlot('fear-sadness__fear-dominant')?.label, 'Dread')
assert.strictEqual(getCompoundEmotionSlot('anger-fear__anger-dominant')?.alternateLabels.includes('Contempt'), true)

const dread = resolveCompoundEmotion({
  a: { channel: 'fear', altitude: 'dissatisfied' },
  b: { channel: 'sadness', altitude: 'dissatisfied' },
  dominantChannel: 'fear',
})
assert.ok(dread, 'fear+sadness with fear dominant resolves')
assert.strictEqual(dread.slot.label, 'Dread')
assert.strictEqual(dread.directCompoundMoveRecommended, false)
assert.deepStrictEqual(dread.componentTreatment.map((item) => item.operation), ['stabilize', 'stabilize'])
assert.ok(dread.treatmentRule.includes('Do not treat a compound directly'))

const reverentApproach = resolveCompoundEmotion({
  a: { channel: 'fear', altitude: 'satisfied' },
  b: { channel: 'joy', altitude: 'satisfied' },
  dominantChannel: 'fear',
})
assert.ok(reverentApproach)
assert.strictEqual(reverentApproach.slot.label, 'Trepidation')
assert.strictEqual(reverentApproach.slot.goldReading, 'Reverent approach')

const thrill = resolveCompoundEmotion({
  a: { channel: 'fear', altitude: 'satisfied' },
  b: { channel: 'joy', altitude: 'satisfied' },
  dominantChannel: 'joy',
})
assert.ok(thrill)
assert.strictEqual(thrill.slot.label, 'Thrill')
assert.strictEqual(thrill.slot.leadReading, 'Recklessness')

assert.strictEqual(
  resolveCompoundEmotion({
    a: { channel: 'fear', altitude: 'neutral' },
    b: { channel: 'fear', altitude: 'neutral' },
    dominantChannel: 'fear',
  }),
  null,
  'same-channel inputs do not produce compounds',
)

console.log('✓ compound emotion lattice tests OK')
