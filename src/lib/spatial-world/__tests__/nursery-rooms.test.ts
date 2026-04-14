/**
 * Nursery Room Builders — unit tests
 *
 * Run: npx tsx src/lib/spatial-world/__tests__/nursery-rooms.test.ts
 */

import {
  buildSpokeIntroRoom,
  buildNurseryRoom,
  buildSpokeNurseryRooms,
  NURSERY_TYPES,
  spokeIntroSlug,
  nurseryRoomSlug,
} from '../nursery-rooms'

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${msg}`)
}

// ─── Spoke Introduction Room ────────────────────────────────────────────────

const intro = buildSpokeIntroRoom('bruised-banana', 0)

// Tilemap is 21×17 = 357 tiles
assert(Object.keys(intro.tilemap).length === 21 * 17, 'intro tilemap should be 21×17')

// Center tile is walkable
assert(!intro.tilemap['10,8']?.impassable, 'intro center should be walkable')

// Corner tiles are impassable (border)
assert(intro.tilemap['0,0']?.impassable === true, 'intro corner should be impassable')

// Anchors: 1 welcome_text + 1 hub portal + 6 face NPCs + 4 nursery portals = 12
assert(intro.anchors.length === 12, `intro should have 12 anchors, got ${intro.anchors.length}`)

// Hub return portal
const hubPortal = intro.anchors.find(a => a.label === 'Return to Campaign Hub')
assert(!!hubPortal, 'intro should have hub return portal')
assert(hubPortal.anchorType === 'portal', 'hub portal should be type portal')

// 6 face NPCs
const faceNpcs = intro.anchors.filter(a => a.anchorType === 'face_npc')
assert(faceNpcs.length === 6, `intro should have 6 face NPCs, got ${faceNpcs.length}`)

const faceNames = faceNpcs.map(a => JSON.parse(a.config!).face).sort()
assert(
  JSON.stringify(faceNames) === JSON.stringify(['architect', 'challenger', 'diplomat', 'regent', 'sage', 'shaman']),
  'face NPCs should cover all 6 faces'
)

// 4 nursery portals
const nurseryPortals = intro.anchors.filter(a => {
  if (a.anchorType !== 'portal') return false
  const config = JSON.parse(a.config!)
  return config.targetSlug?.startsWith('spoke-0-')
})
assert(nurseryPortals.length === 4, `intro should have 4 nursery portals, got ${nurseryPortals.length}`)

// ─── Nursery Room ───────────────────────────────────────────────────────────

const nursery = buildNurseryRoom('clean-up', 0, 'bruised-banana')

// Tilemap is 15×13 = 195 tiles
assert(Object.keys(nursery.tilemap).length === 15 * 13, 'nursery tilemap should be 15×13')

// Center tile walkable
assert(!nursery.tilemap['7,6']?.impassable, 'nursery center should be walkable')

// Anchors: 1 exit portal + 1 activity anchor = 2
assert(nursery.anchors.length === 2, `nursery should have 2 anchors, got ${nursery.anchors.length}`)

// Exit portal
const exitPortal = nursery.anchors.find(a => a.label === 'Back to Spoke Clearing')
assert(!!exitPortal, 'nursery should have exit portal')
assert(JSON.parse(exitPortal.config!).targetSlug === 'spoke-0-intro', 'exit should target intro room')

// Activity anchor
const activity = nursery.anchors.find(a => a.anchorType === 'nursery_activity')
assert(!!activity, 'nursery should have activity anchor')
assert(JSON.parse(activity.config!).nurseryType === 'clean-up', 'activity should be clean-up type')

// ─── Full Spoke Builder ─────────────────────────────────────────────────────

const spoke = buildSpokeNurseryRooms('bruised-banana', 2)
assert(Object.keys(spoke.intro.tilemap).length > 0, 'spoke intro should have tiles')
for (const nt of NURSERY_TYPES) {
  assert(Object.keys(spoke.nurseries[nt].tilemap).length > 0, `spoke ${nt} should have tiles`)
}

// ─── Slug Helpers ───────────────────────────────────────────────────────────

assert(spokeIntroSlug(0) === 'spoke-0-intro', 'intro slug')
assert(spokeIntroSlug(7) === 'spoke-7-intro', 'intro slug 7')
assert(nurseryRoomSlug(0, 'clean-up') === 'spoke-0-clean-up', 'nursery slug')
assert(nurseryRoomSlug(3, 'grow-up') === 'spoke-3-grow-up', 'nursery slug 3')

console.log('✓ nursery-rooms: all assertions passed')
