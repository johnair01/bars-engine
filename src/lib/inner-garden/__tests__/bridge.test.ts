import assert from 'node:assert/strict'
import {
  BARS_TO_INNER_GARDEN_SCHEMA_VERSION,
  buildBarsInnerGardenImportPayload,
  buildShamanResultSeedMetabolization,
  getInnerGardenEligibilityReason,
  isRawInnerGardenMaturity,
  toInnerGardenEligibleBar,
  type InnerGardenBarCandidate,
} from '@/lib/inner-garden/bridge'
import { effectiveMaturity, parseSeedMetabolization } from '@/lib/bar-seed-metabolization'

const PLAYER_ID = 'player_1'

function candidate(patch: Partial<InnerGardenBarCandidate> = {}): InnerGardenBarCandidate {
  return {
    id: 'bar_1',
    title: 'A raw charge',
    description: 'I felt the charge in the room.',
    type: 'bar',
    creatorId: PLAYER_ID,
    status: 'active',
    archivedAt: null,
    seedMetabolization: null,
    nation: 'metal',
    intensity: '4',
    campaignRef: null,
    gameMasterFace: null,
    hexagramId: null,
    isSystem: false,
    inviteId: null,
    mergedIntoId: null,
    ...patch,
  }
}

function testEligibility() {
  assert.equal(getInnerGardenEligibilityReason(candidate(), PLAYER_ID), null)
  assert.equal(getInnerGardenEligibilityReason(candidate({ type: 'charge_capture' }), PLAYER_ID), null)
  assert.equal(getInnerGardenEligibilityReason(candidate({ type: 'quest' }), PLAYER_ID), 'unsupported-type')
  assert.equal(getInnerGardenEligibilityReason(candidate({ type: 'campaign_kernel' }), PLAYER_ID), 'unsupported-type')
  assert.equal(getInnerGardenEligibilityReason(candidate({ creatorId: 'other' }), PLAYER_ID), 'not-owned')
  assert.equal(getInnerGardenEligibilityReason(candidate({ status: 'done' }), PLAYER_ID), 'inactive')
  assert.equal(getInnerGardenEligibilityReason(candidate({ archivedAt: new Date() }), PLAYER_ID), 'archived')
  assert.equal(getInnerGardenEligibilityReason(candidate({ isSystem: true }), PLAYER_ID), 'system-bar')
  assert.equal(getInnerGardenEligibilityReason(candidate({ inviteId: 'invite_1' }), PLAYER_ID), 'invitation-bar')
  assert.equal(getInnerGardenEligibilityReason(candidate({ mergedIntoId: 'bar_2' }), PLAYER_ID), 'merged')
  assert.equal(
    getInnerGardenEligibilityReason(candidate({ seedMetabolization: '{"maturity":"context_named"}' }), PLAYER_ID),
    'not-raw'
  )
}

function testRawMaturity() {
  assert.equal(isRawInnerGardenMaturity(null), true)
  assert.equal(isRawInnerGardenMaturity(''), true)
  assert.equal(isRawInnerGardenMaturity('{"maturity":"captured"}'), true)
  assert.equal(isRawInnerGardenMaturity('{"maturity":"elaborated"}'), false)
}

function testPayload() {
  const eligible = toInnerGardenEligibleBar(candidate(), {
    kind: 'hand',
    slotIndex: 0,
    isCarrying: true,
  })
  const payload = buildBarsInnerGardenImportPayload(eligible)

  assert.equal(payload.schemaVersion, BARS_TO_INNER_GARDEN_SCHEMA_VERSION)
  assert.equal(payload.source, 'bars-engine')
  assert.equal(payload.bar.id, 'bar_1')
  assert.equal(payload.bar.type, 'bar')
  assert.equal(payload.bar.elementHint, 'metal')
  assert.equal(payload.bar.emotionHint, 'fear')
  assert.deepEqual(payload.location, { kind: 'hand', slotIndex: 0, isCarrying: true })
  assert.equal(Object.prototype.hasOwnProperty.call(payload.bar, 'creatorId'), false)
}

function testResultMaturity() {
  const raw = buildShamanResultSeedMetabolization(null, 'The charge wants a boundary.')
  const parsed = parseSeedMetabolization(raw)
  assert.equal(effectiveMaturity(parsed), 'context_named')
  assert.equal(parsed.soilKind, 'holding_pen')
  assert.equal(parsed.contextNote, 'The charge wants a boundary.')
}

testEligibility()
testRawMaturity()
testPayload()
testResultMaturity()

console.log('inner-garden bridge: eligibility and payload OK')

