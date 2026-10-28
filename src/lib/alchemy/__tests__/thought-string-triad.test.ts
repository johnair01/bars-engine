import * as assert from 'node:assert'
import {
  deriveElementalTriad,
  deriveSupportedElementalTriads,
  elementalTriadElements,
  type ThoughtStringAnchor,
} from '../thought-string-triad'

// Fixture: the first dojo lesson revealed by Wendell's thought string.
// It is deterministic only after the player confirms each EA anchor.
const metalWaterWood: ThoughtStringAnchor[] = [
  { wordId: 'word-wonder', state: { channel: 'fear', altitude: 'satisfied' }, status: 'confirmed' },
  { wordId: 'word-poignance', state: { channel: 'sadness', altitude: 'satisfied' }, status: 'confirmed' },
  { wordId: 'word-joy', state: { channel: 'joy', altitude: 'satisfied' }, status: 'confirmed' },
  // This intentionally evocative word never becomes an EA anchor merely by existing.
  { wordId: 'word-hope', state: { channel: 'joy', altitude: 'satisfied' }, status: 'proposed' },
]

const triad = deriveElementalTriad({ channel: 'fear', altitude: 'satisfied' })
assert.deepStrictEqual(triad.states, [
  { channel: 'fear', altitude: 'satisfied' },
  { channel: 'sadness', altitude: 'satisfied' },
  { channel: 'joy', altitude: 'satisfied' },
])
assert.deepStrictEqual(elementalTriadElements(triad), ['metal', 'water', 'wood'])
assert.deepStrictEqual(triad.shengEdges.map((edge) => edge.moveId), ['metal_water', 'water_wood'])
assert.deepStrictEqual(triad.shengEdges.map((edge) => edge.moveName), ['Deepen Value', 'Renew Vitality'])
assert.strictEqual(triad.keClosingEdge.moveId, 'metal_wood')
assert.strictEqual(triad.keClosingEdge.moveName, 'Activate Hope')

const supported = deriveSupportedElementalTriads(metalWaterWood)
assert.strictEqual(supported.length, 1)
assert.deepStrictEqual(supported[0].confirmedWordIds, ['word-wonder', 'word-poignance', 'word-joy'])

// A proposed match and a missing anchor cannot produce a move card.
assert.deepStrictEqual(deriveSupportedElementalTriads(metalWaterWood.slice(0, 2)), [])
assert.deepStrictEqual(
  deriveSupportedElementalTriads([
    ...metalWaterWood.slice(0, 2),
    { wordId: 'word-joy', state: { channel: 'joy', altitude: 'neutral' }, status: 'confirmed' },
  ]),
  [],
)

// Stable ordering is part of the persistence contract, not a UI accident.
assert.deepStrictEqual(
  deriveSupportedElementalTriads([...metalWaterWood].reverse()),
  supported,
)

console.log('thought-string elemental triad fixture passed')
