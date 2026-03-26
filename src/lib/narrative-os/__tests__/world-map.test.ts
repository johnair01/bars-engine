import assert from 'node:assert'
import { buildWorldMapPayload, buildWorldMapState } from '../world-map'
import { NARRATIVE_SPACE_SECTIONS, SPACE_IDS } from '../index'

assert.strictEqual(NARRATIVE_SPACE_SECTIONS.length, 4, 'four narrative spaces')
assert.deepStrictEqual(
  NARRATIVE_SPACE_SECTIONS.map((s) => s.id),
  [...SPACE_IDS],
  'space order matches SPACE_IDS'
)

const payload = buildWorldMapPayload()
assert.strictEqual(payload.version, 1)
assert.strictEqual(payload.spaces.length, 4)
assert.strictEqual(payload.starterPlayAvailable, true)
assert.ok(payload.recommendations.length > 0)

const state = buildWorldMapState(null)
assert.strictEqual(state.playerId, null)
assert.strictEqual(state.starterWorldReady, true)
assert.strictEqual(state.unlockedSpaces.length, 4)

const state2 = buildWorldMapState('player-1')
assert.strictEqual(state2.playerId, 'player-1')

console.log('narrative-os world-map tests ok')
