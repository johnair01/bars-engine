/**
 * Tests for CYOA Composer Checkpoint Persistence
 *
 * Verifies AC10: Checkpoint fires on every node transition (auto-save)
 *
 * Tests the pure logic layer — no DB, no server actions.
 * @see src/lib/cyoa-composer/checkpoint-persistence.ts
 *
 * Run: tsx src/lib/cyoa-composer/__tests__/checkpoint-persistence.test.ts
 */

import assert from 'node:assert'
import {
  buildCheckpointPatch,
  restoreCheckpoint,
  mergeCheckpointIntoState,
  shouldCheckpointOnTransition,
  buildCheckpointNodeMeta,
} from '../checkpoint-persistence'
import {
  createBuildState,
  lockChoice,
  CYOA_BUILD_STATE_KEY,
  CYOA_BUILD_CHECKPOINT_KEY,
} from '@/lib/cyoa/build-contract'
import type { CyoaBuildState } from '@/lib/cyoa/build-contract'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDraftState(overrides?: Partial<CyoaBuildState>): CyoaBuildState {
  return {
    ...createBuildState({
      buildId: 'build_test_1',
      campaignRef: 'camp_test',
      spokeIndex: 0,
    }),
    ...overrides,
  }
}

function makeFinalizedState(): CyoaBuildState {
  return makeDraftState({ status: 'finalized' })
}

function makeLockedState(): CyoaBuildState {
  return makeDraftState({
    status: 'locked',
    face: lockChoice('shaman' as const),
    emotionalVector: lockChoice({
      channelFrom: 'Fear' as const,
      altitudeFrom: 'dissatisfied' as const,
      channelTo: 'Joy' as const,
      altitudeTo: 'satisfied' as const,
    }),
  })
}

// ---------------------------------------------------------------------------
// buildCheckpointPatch
// ---------------------------------------------------------------------------

{
  console.log('▸ buildCheckpointPatch — produces correct keys')
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)

  assert.ok(CYOA_BUILD_STATE_KEY in patch, 'patch has build state key')
  assert.ok(CYOA_BUILD_CHECKPOINT_KEY in patch, 'patch has checkpoint key')
}

{
  console.log('▸ buildCheckpointPatch — checkpoint envelope has v:1, savedAt, needsRevalidation')
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)
  const checkpoint = patch[CYOA_BUILD_CHECKPOINT_KEY]

  assert.equal(checkpoint.v, 1)
  assert.equal(typeof checkpoint.savedAt, 'string')
  assert.equal(checkpoint.needsRevalidation, true)
}

{
  console.log('▸ buildCheckpointPatch — updates updatedAt timestamp')
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)
  const saved = patch[CYOA_BUILD_STATE_KEY]

  assert.equal(typeof saved.updatedAt, 'string')
  assert.equal(saved.buildId, state.buildId)
}

{
  console.log('▸ buildCheckpointPatch — preserves all fields of locked state')
  const state = makeLockedState()
  const patch = buildCheckpointPatch(state)
  const saved = patch[CYOA_BUILD_STATE_KEY]

  assert.equal(saved.buildId, state.buildId)
  assert.equal(saved.campaignRef, state.campaignRef)
  assert.equal(saved.spokeIndex, state.spokeIndex)
  assert.deepStrictEqual(saved.face, state.face)
  assert.equal(saved.status, state.status)
}

{
  console.log('▸ buildCheckpointPatch — checkpoint envelope contains the build state')
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)
  const checkpoint = patch[CYOA_BUILD_CHECKPOINT_KEY]

  assert.equal(checkpoint.buildState.buildId, state.buildId)
}

// ---------------------------------------------------------------------------
// restoreCheckpoint
// ---------------------------------------------------------------------------

{
  console.log('▸ restoreCheckpoint — returns found:false for empty stateData')
  const result = restoreCheckpoint({})
  assert.equal(result.found, false)
}

{
  console.log('▸ restoreCheckpoint — restores from checkpoint envelope')
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)
  const stateData = { ...patch, someOtherKey: 'preserved' }
  const result = restoreCheckpoint(stateData)

  assert.equal(result.found, true)
  if (result.found) {
    assert.equal(result.buildState.buildId, state.buildId)
    assert.equal(result.needsRevalidation, true)
  }
}

{
  console.log('▸ restoreCheckpoint — falls back to raw build state key')
  const state = makeDraftState()
  const stateData = { [CYOA_BUILD_STATE_KEY]: state }
  const result = restoreCheckpoint(stateData)

  assert.equal(result.found, true)
  if (result.found) {
    assert.equal(result.buildState.buildId, state.buildId)
    assert.equal(result.needsRevalidation, true)
  }
}

{
  console.log('▸ restoreCheckpoint — returns found:false for invalid data')
  const stateData = {
    [CYOA_BUILD_CHECKPOINT_KEY]: { garbage: true },
    [CYOA_BUILD_STATE_KEY]: { alsoGarbage: true },
  }
  const result = restoreCheckpoint(stateData)
  assert.equal(result.found, false)
}

{
  console.log('▸ restoreCheckpoint — round-trips through build → restore')
  const state = makeLockedState()
  const patch = buildCheckpointPatch(state)
  const stateData: Record<string, unknown> = { ...patch }
  const result = restoreCheckpoint(stateData)

  assert.equal(result.found, true)
  if (result.found) {
    assert.equal(result.buildState.buildId, state.buildId)
    assert.equal(result.buildState.campaignRef, state.campaignRef)
    assert.deepStrictEqual(result.buildState.face, state.face)
  }
}

// ---------------------------------------------------------------------------
// mergeCheckpointIntoState
// ---------------------------------------------------------------------------

{
  console.log('▸ mergeCheckpointIntoState — preserves existing keys')
  const existing = {
    cyoaArtifactLedger: ['bar1', 'bar2'],
    cyoaHexagramState: { hexagramId: 42 },
  }
  const state = makeDraftState()
  const patch = buildCheckpointPatch(state)
  const merged = mergeCheckpointIntoState(existing, patch)

  assert.deepStrictEqual(merged.cyoaArtifactLedger, ['bar1', 'bar2'])
  assert.deepStrictEqual(merged.cyoaHexagramState, { hexagramId: 42 })
  assert.ok(CYOA_BUILD_STATE_KEY in merged)
  assert.ok(CYOA_BUILD_CHECKPOINT_KEY in merged)
}

{
  console.log('▸ mergeCheckpointIntoState — overwrites existing checkpoint keys')
  const state1 = makeDraftState()
  const patch1 = buildCheckpointPatch(state1)
  const merged1 = mergeCheckpointIntoState({}, patch1)

  const state2 = makeDraftState({ buildId: 'build_test_2', status: 'locked' })
  const patch2 = buildCheckpointPatch(state2)
  const merged2 = mergeCheckpointIntoState(merged1, patch2)

  const savedState = merged2[CYOA_BUILD_STATE_KEY] as CyoaBuildState
  assert.equal(savedState.buildId, 'build_test_2')
  assert.equal(savedState.status, 'locked')
}

// ---------------------------------------------------------------------------
// shouldCheckpointOnTransition
// ---------------------------------------------------------------------------

{
  console.log('▸ shouldCheckpointOnTransition — false for empty stateData')
  assert.equal(shouldCheckpointOnTransition({}, 'node_1'), false)
}

{
  console.log('▸ shouldCheckpointOnTransition — false for invalid build state')
  assert.equal(
    shouldCheckpointOnTransition({ [CYOA_BUILD_STATE_KEY]: { garbage: true } }, 'node_1'),
    false,
  )
}

{
  console.log('▸ shouldCheckpointOnTransition — true for drafting build on any node')
  const state = makeDraftState()
  const stateData = { [CYOA_BUILD_STATE_KEY]: state }

  assert.equal(shouldCheckpointOnTransition(stateData, 'node_1'), true)
  assert.equal(shouldCheckpointOnTransition(stateData, 'BB_Intro'), true)
  assert.equal(shouldCheckpointOnTransition(stateData, 'Portal_3'), true)
  assert.equal(shouldCheckpointOnTransition(stateData, 'depth_2_sage'), true)
}

{
  console.log('▸ shouldCheckpointOnTransition — true for locked build')
  const state = makeLockedState()
  const stateData = { [CYOA_BUILD_STATE_KEY]: state }
  assert.equal(shouldCheckpointOnTransition(stateData, 'node_1'), true)
}

{
  console.log('▸ shouldCheckpointOnTransition — false for finalized build')
  const state = makeFinalizedState()
  const stateData = { [CYOA_BUILD_STATE_KEY]: state }
  assert.equal(shouldCheckpointOnTransition(stateData, 'node_1'), false)
}

// ---------------------------------------------------------------------------
// buildCheckpointNodeMeta
// ---------------------------------------------------------------------------

{
  console.log('▸ buildCheckpointNodeMeta — creates metadata')
  const meta = buildCheckpointNodeMeta('Portal_3')
  assert.equal(meta.nodeId, 'Portal_3')
  assert.equal(typeof meta.transitionedAt, 'string')
  assert.equal(meta.composerStep, undefined)
}

{
  console.log('▸ buildCheckpointNodeMeta — includes composerStep')
  const meta = buildCheckpointNodeMeta('node_42', 'face_selection')
  assert.equal(meta.composerStep, 'face_selection')
}

// ---------------------------------------------------------------------------
// End-to-end: node transition checkpoint cycle
// ---------------------------------------------------------------------------

{
  console.log('▸ E2E — full checkpoint save → restore cycle')

  // Step 1: Player starts a build
  const initialState = makeDraftState()

  // Step 2: Node transition → checkpoint fires
  const stateData1 = { [CYOA_BUILD_STATE_KEY]: initialState }
  assert.equal(shouldCheckpointOnTransition(stateData1, 'node_1'), true)

  const patch1 = buildCheckpointPatch(initialState)
  const merged1 = mergeCheckpointIntoState({}, patch1)

  // Step 3: Another transition → checkpoint fires again
  assert.equal(shouldCheckpointOnTransition(merged1, 'node_2'), true)

  // Step 4: Lock (face selected)
  const lockedState: CyoaBuildState = {
    ...(merged1[CYOA_BUILD_STATE_KEY] as CyoaBuildState),
    face: lockChoice('challenger' as const),
    status: 'locked',
  }
  const patch2 = buildCheckpointPatch(lockedState)
  const merged2 = mergeCheckpointIntoState(merged1, patch2)

  // Step 5: Restore — should get locked state
  const restored = restoreCheckpoint(merged2)
  assert.equal(restored.found, true)
  if (restored.found) {
    assert.equal(restored.buildState.face.status, 'locked')
    assert.equal(restored.buildState.status, 'locked')
    assert.equal(restored.needsRevalidation, true)
  }

  // Step 6: Finalize → no more checkpoints
  const finalizedData: Record<string, unknown> = {
    ...merged2,
    [CYOA_BUILD_STATE_KEY]: {
      ...(merged2[CYOA_BUILD_STATE_KEY] as CyoaBuildState),
      status: 'finalized',
    },
  }
  assert.equal(shouldCheckpointOnTransition(finalizedData, 'terminal_node'), false)
}

{
  console.log('▸ E2E — preserves cyoaArtifactLedger across checkpoints')

  const existingData = {
    cyoaArtifactLedger: [{ barId: 'bar_1', title: 'Test BAR' }],
    cyoaHexagramState: { hexagramId: 7, savedAt: '2026-01-01' },
    gscp: { campaignRef: 'test' },
  }

  const state = makeDraftState()
  const patch1 = buildCheckpointPatch(state)
  const merged1 = mergeCheckpointIntoState(existingData, patch1)

  // Existing keys preserved
  assert.deepStrictEqual(merged1.cyoaArtifactLedger, existingData.cyoaArtifactLedger)
  assert.deepStrictEqual(merged1.cyoaHexagramState, existingData.cyoaHexagramState)
  assert.deepStrictEqual(merged1.gscp, existingData.gscp)

  // Second checkpoint
  const updatedState: CyoaBuildState = {
    ...(merged1[CYOA_BUILD_STATE_KEY] as CyoaBuildState),
    extras: { visitedNodes: ['node_1', 'node_2'] },
  }
  const patch2 = buildCheckpointPatch(updatedState)
  const merged2 = mergeCheckpointIntoState(merged1, patch2)

  // STILL preserved after second checkpoint
  assert.deepStrictEqual(merged2.cyoaArtifactLedger, existingData.cyoaArtifactLedger)
  assert.deepStrictEqual(merged2.cyoaHexagramState, existingData.cyoaHexagramState)
  assert.deepStrictEqual(merged2.gscp, existingData.gscp)

  // Checkpoint data updated
  const restoredState = merged2[CYOA_BUILD_STATE_KEY] as CyoaBuildState
  assert.deepStrictEqual(restoredState.extras, { visitedNodes: ['node_1', 'node_2'] })
}

console.log('\n✅ All checkpoint-persistence tests passed')
