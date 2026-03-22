import assert from 'node:assert'
import {
  quadrantLabelsFromPairs,
  defaultGridPolarities,
  parseGridPoliciesFromStoryProgress,
  mergeStoryProgressGridPolarities,
  gridAxisSourceFromStoredJson,
} from '@/lib/creator-scene-grid-deck/polarities'

const d = defaultGridPolarities()
const labels = quadrantLabelsFromPairs(d)
assert.strictEqual(labels.SCENE_GRID_TOP_DOM, 'Top · Lead')
assert.strictEqual(labels.SCENE_GRID_BOTTOM_SUB, 'Bottom · Follow')

const custom = {
  pair1: { negativeLabel: 'A', positiveLabel: 'B' },
  pair2: { negativeLabel: 'X', positiveLabel: 'Y' },
}
const l2 = quadrantLabelsFromPairs({ pair1: custom.pair1, pair2: custom.pair2 })
assert.strictEqual(l2.SCENE_GRID_TOP_DOM, 'A · X')
assert.strictEqual(l2.SCENE_GRID_BOTTOM_SUB, 'B · Y')

const parsed = parseGridPoliciesFromStoryProgress(
  JSON.stringify({
    other: true,
    gridPolarities: {
      pair1: { negativeLabel: 'In', positiveLabel: 'Out' },
      pair2: { negativeLabel: 'Soft', positiveLabel: 'Firm' },
      adventureSlug: 'wake-values-v0',
    },
  })
)
assert.ok(parsed)
assert.strictEqual(parsed?.pair1.negativeLabel, 'In')

const merged = mergeStoryProgressGridPolarities('{"foo":1}', {
  pair1: { negativeLabel: 'P', positiveLabel: 'Q' },
  pair2: { negativeLabel: 'R', positiveLabel: 'S' },
  adventureSlug: 'x',
})
const o = JSON.parse(merged) as { foo: number; gridPolarities: unknown }
assert.strictEqual(o.foo, 1)
assert.ok(o.gridPolarities)

assert.strictEqual(gridAxisSourceFromStoredJson(undefined), 'adventure')
assert.strictEqual(gridAxisSourceFromStoredJson('oriented'), 'oriented')
assert.strictEqual(gridAxisSourceFromStoredJson('wake-up-orientation'), 'adventure')

const orientedMerge = mergeStoryProgressGridPolarities(null, {
  pair1: { negativeLabel: 'A', positiveLabel: 'B' },
  pair2: { negativeLabel: 'C', positiveLabel: 'D' },
  source: 'oriented',
  adventureSlug: 'test',
})
const parsedOriented = parseGridPoliciesFromStoryProgress(orientedMerge)
assert.strictEqual(parsedOriented?.source, 'oriented')

console.log('polarities: OK')
