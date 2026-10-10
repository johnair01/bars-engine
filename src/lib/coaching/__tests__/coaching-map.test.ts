/**
 * The coaching map: a station gives a sentence to keep only once it is played
 * (cg-kept-sentence), and the copied record reads back what the visitor wrote,
 * in the order of the five moves, with nothing invented.
 */
import assert from 'node:assert/strict'
import { DOORS, EMPTY_MAP, SITUATIONS, STATIONS, composeMap, keptSentence } from '../coaching-map'

// Nothing played: no station has a sentence, and the record is only its heading.
for (const s of STATIONS) assert.equal(keptSentence(s.id, EMPTY_MAP), null, `${s.id} starts empty`)
assert.equal(composeMap(EMPTY_MAP), 'My coaching map')

// Half-played stations still give nothing.
assert.equal(keptSentence('wake', { ...EMPTY_MAP, wake: { place: 'chest', texture: '' } }), null)
assert.equal(keptSentence('open', { ...EMPTY_MAP, open: { feeling: 'Fear', answer: '   ' } }), null)

const map = {
  ...EMPTY_MAP,
  wake: { place: 'chest', texture: 'tightness' },
  open: { feeling: 'Fear' as const, answer: '  Losing the client, and it feels close.  ' },
  clean: { quality: 'reading a room fast', move: '' },
  show: { move: 'ask Dana to co-host', when: 'Friday' },
}

assert.equal(keptSentence('wake', map), 'When it shows up, I feel tightness in my chest.')
assert.equal(keptSentence('open', map), 'Fear is doing its job. Losing the client, and it feels close.')
assert.equal(keptSentence('clean', map), 'I am taking back reading a room fast.')
assert.equal(keptSentence('grow', map), null)
assert.equal(keptSentence('show', map), 'The move that has to be mine: ask Dana to co-host, by Friday.')
assert.equal(
  keptSentence('wake', { ...EMPTY_MAP, wake: { place: 'belly', texture: 'something else' } }),
  'When it shows up, I feel something in my belly.',
)

// The record follows the five moves' order and leaves out the station not played.
const record = composeMap(map)
const order = ['Wake Up:', 'Open Up:', 'Clean Up:', 'Show Up:'].map((h) => record.indexOf(h))
assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), 'stations in order')
assert.ok(!record.includes('Grow Up'), 'unplayed station left out')

// Every situation on the first screen leads to a station, and every station has a situation.
assert.deepEqual(new Set(SITUATIONS.map((s) => s.station)), new Set(STATIONS.map((s) => s.id)))

// Free doors point at pages on this site; booking is added by the page itself (cg-money).
for (const doors of Object.values(DOORS)) for (const d of doors) assert.ok(d.href.startsWith('/'), d.href)

console.log('coaching-map: ok')
