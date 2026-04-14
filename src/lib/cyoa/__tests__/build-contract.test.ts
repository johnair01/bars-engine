/**
 * Tests for CYOA Composer Build Contract — Locked-Choice State Model
 *
 * Validates: lock/unlock semantics, receipt immutability, checkpoint
 * serialization round-trips, type guards, and finalization guards.
 */

import assert from 'node:assert'
import {
  emptyChoice,
  draftChoice,
  lockChoice,
  isLocked,
  isUnlocked,
  choiceValue,
  createBuildState,
  finalizeReceipt,
  createCheckpoint,
  markRevalidated,
  serializeBuildState,
  deserializeBuildState,
  serializeCheckpoint,
  deserializeCheckpoint,
  isCyoaBuildState,
  isCyoaBuildReceipt,
  isCyoaBuildCheckpoint,
} from '@/lib/cyoa/build-contract'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Choice<T> helpers
// ---------------------------------------------------------------------------

{
  // emptyChoice starts unlocked with null value
  const c = emptyChoice<GameMasterFace>()
  assert.equal(c.status, 'unlocked')
  assert.equal(c.value, null)
  assert.ok(isUnlocked(c))
  assert.ok(!isLocked(c))
  assert.equal(choiceValue(c), null)
}

{
  // draftChoice starts unlocked with a value
  const c = draftChoice<GameMasterFace>('sage')
  assert.equal(c.status, 'unlocked')
  assert.equal(c.value, 'sage')
  assert.ok(isUnlocked(c))
  assert.equal(choiceValue(c), 'sage')
}

{
  // lockChoice produces an immutable locked choice
  const c = lockChoice<GameMasterFace>('diplomat')
  assert.equal(c.status, 'locked')
  assert.equal(c.value, 'diplomat')
  assert.ok(isLocked(c))
  assert.ok(!isUnlocked(c))
  assert.equal(choiceValue(c), 'diplomat')
  assert.ok(typeof c.lockedAt === 'string')
  // lockedAt should be a valid ISO string
  assert.ok(!isNaN(new Date(c.lockedAt).getTime()))
}

// ---------------------------------------------------------------------------
// CyoaBuildState factory
// ---------------------------------------------------------------------------

{
  const state = createBuildState({
    buildId: 'build-001',
    campaignRef: 'camp-1',
    spokeIndex: 0,
  })
  assert.equal(state.v, 1)
  assert.equal(state.buildId, 'build-001')
  assert.equal(state.campaignRef, 'camp-1')
  assert.equal(state.spokeIndex, 0)
  assert.equal(state.face.status, 'unlocked')
  assert.equal(state.emotionalVector.status, 'unlocked')
  assert.equal(state.narrativeTemplate, null)
  assert.equal(state.stepOrder, null)
  assert.equal(state.status, 'drafting')
  assert.ok(isCyoaBuildState(state))
}

{
  // With custom step order
  const state = createBuildState({
    buildId: 'build-002',
    campaignRef: 'camp-2',
    spokeIndex: 3,
    stepOrder: ['emotion', 'face', 'template', 'confirm'],
  })
  assert.deepStrictEqual(state.stepOrder, ['emotion', 'face', 'template', 'confirm'])
}

// ---------------------------------------------------------------------------
// Finalize receipt — guards
// ---------------------------------------------------------------------------

{
  // Cannot finalize without locked face
  const state = createBuildState({
    buildId: 'build-003',
    campaignRef: 'camp-1',
    spokeIndex: 0,
  })
  assert.equal(finalizeReceipt(state), null)
}

{
  // Cannot finalize without locked emotional vector
  const state = createBuildState({
    buildId: 'build-004',
    campaignRef: 'camp-1',
    spokeIndex: 0,
  })
  state.face = lockChoice<GameMasterFace>('shaman')
  assert.equal(finalizeReceipt(state), null)
}

{
  // Cannot finalize without narrative template
  const state = createBuildState({
    buildId: 'build-005',
    campaignRef: 'camp-1',
    spokeIndex: 0,
  })
  const ev: EmotionalVector = {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  }
  state.face = lockChoice<GameMasterFace>('challenger')
  state.emotionalVector = lockChoice(ev)
  assert.equal(finalizeReceipt(state), null)
}

{
  // Successful finalization
  const state = createBuildState({
    buildId: 'build-006',
    campaignRef: 'camp-1',
    spokeIndex: 2,
  })
  const ev: EmotionalVector = {
    channelFrom: 'Anger',
    altitudeFrom: 'neutral',
    channelTo: 'Sadness',
    altitudeTo: 'satisfied',
  }
  state.face = lockChoice<GameMasterFace>('regent')
  state.emotionalVector = lockChoice(ev)
  state.narrativeTemplate = { templateId: 'tpl-1', templateKind: 'quest' }
  state.extras = { customField: 42 }

  const receipt = finalizeReceipt(state)
  assert.ok(receipt !== null)
  assert.equal(receipt!.buildId, 'build-006')
  assert.equal(receipt!.campaignRef, 'camp-1')
  assert.equal(receipt!.spokeIndex, 2)
  assert.equal(receipt!.face, 'regent')
  assert.deepStrictEqual(receipt!.emotionalVector, ev)
  assert.deepStrictEqual(receipt!.narrativeTemplate, { templateId: 'tpl-1', templateKind: 'quest' })
  assert.equal(receipt!.extras.customField, 42)
  assert.ok(isCyoaBuildReceipt(receipt))

  // Extras are a snapshot — mutating original doesn't affect receipt
  state.extras.customField = 99
  assert.equal(receipt!.extras.customField, 42)
}

// ---------------------------------------------------------------------------
// Checkpoint persistence
// ---------------------------------------------------------------------------

{
  const state = createBuildState({
    buildId: 'build-007',
    campaignRef: 'camp-1',
    spokeIndex: 1,
  })
  state.face = lockChoice<GameMasterFace>('architect')

  const checkpoint = createCheckpoint(state)
  assert.equal(checkpoint.v, 1)
  assert.equal(checkpoint.needsRevalidation, true)
  assert.ok(isCyoaBuildCheckpoint(checkpoint))

  // markRevalidated clears the flag without mutating original
  const revalidated = markRevalidated(checkpoint)
  assert.equal(revalidated.needsRevalidation, false)
  assert.equal(checkpoint.needsRevalidation, true) // original unchanged
}

// ---------------------------------------------------------------------------
// Serialization round-trips
// ---------------------------------------------------------------------------

{
  const state = createBuildState({
    buildId: 'build-008',
    campaignRef: 'camp-rt',
    spokeIndex: 5,
  })
  state.face = lockChoice<GameMasterFace>('sage')
  state.emotionalVector = draftChoice<EmotionalVector>({
    channelFrom: 'Joy',
    altitudeFrom: 'satisfied',
    channelTo: 'Neutrality',
    altitudeTo: 'neutral',
  })

  const json = serializeBuildState(state)
  const restored = deserializeBuildState(json)
  assert.ok(restored !== null)
  assert.deepStrictEqual(restored, state)
}

{
  // Invalid JSON returns null
  assert.equal(deserializeBuildState('not json'), null)
  assert.equal(deserializeBuildState('{"v":2}'), null)
  assert.equal(deserializeBuildState('null'), null)
}

{
  // Checkpoint round-trip
  const state = createBuildState({
    buildId: 'build-009',
    campaignRef: 'camp-cp',
    spokeIndex: 0,
  })
  const checkpoint = createCheckpoint(state)
  const json = serializeCheckpoint(checkpoint)
  const restored = deserializeCheckpoint(json)
  assert.ok(restored !== null)
  assert.deepStrictEqual(restored, checkpoint)
}

{
  // Invalid checkpoint JSON returns null
  assert.equal(deserializeCheckpoint('garbage'), null)
  assert.equal(deserializeCheckpoint('{"v":1}'), null)
}

// ---------------------------------------------------------------------------
// Type guards — negative cases
// ---------------------------------------------------------------------------

{
  assert.ok(!isCyoaBuildState(null))
  assert.ok(!isCyoaBuildState(undefined))
  assert.ok(!isCyoaBuildState(42))
  assert.ok(!isCyoaBuildState({ v: 1 })) // missing fields
  assert.ok(!isCyoaBuildState({ v: 2, buildId: 'x', campaignRef: 'y', spokeIndex: 0 }))
}

{
  assert.ok(!isCyoaBuildReceipt(null))
  assert.ok(!isCyoaBuildReceipt({ v: 1 }))
  assert.ok(!isCyoaBuildReceipt({ v: 1, buildId: 'x', face: 123 })) // face not string
}

{
  assert.ok(!isCyoaBuildCheckpoint(null))
  assert.ok(!isCyoaBuildCheckpoint({ v: 1, savedAt: 'x', needsRevalidation: true })) // missing buildState
}

console.log('✓ build-contract tests passed')
