/**
 * Orientation Meta-Packet — Dispatch/Compile + Any-Order Completion Tracking Tests
 *
 * Run with: npx tsx src/lib/quest-grammar/__tests__/orientationMetaPacket.test.ts
 */

import {
  compileOrientationMetaPacket,
  getOrientationMetaPacketNodeIds,
  ORIENTATION_SUB_PACKET_FACES,
  ORIENTATION_SUB_PACKET_COUNT,
  createInitialMetaPacketState,
  startSubPacket,
  markSubPacketComplete,
  isMetaPacketComplete,
  getCompletedSubPackets,
  getPendingSubPackets,
  getInProgressSubPackets,
  getMetaPacketProgress,
} from '../orientationMetaPacket'
import {
  FACE_TO_CANONICAL_MOVE_ID,
  faceSubPacketPrefix,
  faceSubPacketTerminalId,
  compileFaceSubPacketWithConvergence,
  instantiateAllFaceSubPackets,
} from '../orientationFaceSubPacket'
import { GAME_MASTER_FACES } from '../types'
import type { GameMasterFace } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) throw new Error(`${message}\n  actual:   ${a}\n  expected: ${e}`)
}

// ===========================================================================
// SECTION 1 — DISPATCH / COMPILE TESTS (Sub-AC 3)
// ===========================================================================

/** Test: meta-packet compiles without errors */
function testCompileMetaPacketBasic() {
  const packet = compileOrientationMetaPacket()
  assert(packet !== undefined, 'Packet should be defined')
  assert(Array.isArray(packet.nodes), 'Packet should have nodes array')
  assert(packet.nodes.length > 0, 'Packet should have at least one node')
  assertEqual(packet.startNodeId, 'orient_intro', 'startNodeId should be orient_intro')
  assertEqual(packet.segmentVariant, 'player', 'Default segment should be player')
  console.log('✓ testCompileMetaPacketBasic')
}

/** Test: meta-packet emits orient_intro, orient_face_hub, orient_terminal */
function testMetaPacketStructureNodes() {
  const packet = compileOrientationMetaPacket()
  const ids = packet.nodes.map((n) => n.id)

  assert(ids.includes('orient_intro'), 'Should include orient_intro')
  assert(ids.includes('orient_face_hub'), 'Should include orient_face_hub')
  assert(ids.includes('orient_terminal'), 'Should include orient_terminal')
  console.log('✓ testMetaPacketStructureNodes')
}

/** Test: dispatch hub has exactly 6 choices (one per face) */
function testDispatchHubChoices() {
  const packet = compileOrientationMetaPacket()
  const hub = packet.nodes.find((n) => n.id === 'orient_face_hub')

  assert(hub !== undefined, 'orient_face_hub should exist')
  assertEqual(hub!.choices.length, 6, 'Hub should have 6 choices (one per face)')
  assertEqual(hub!.choiceType, 'altitudinal', 'Hub choiceType should be altitudinal')

  // Each choice target should correspond to a real node in the packet
  const nodeIds = new Set(packet.nodes.map((n) => n.id))
  for (const choice of hub!.choices) {
    assert(
      nodeIds.has(choice.targetId),
      `Hub choice targetId '${choice.targetId}' should exist in packet nodes`
    )
  }
  console.log('✓ testDispatchHubChoices')
}

/** Test: each face sub-packet's start node is reachable from the hub */
function testFaceSubPacketsReachableFromHub() {
  const packet = compileOrientationMetaPacket()
  const hub = packet.nodes.find((n) => n.id === 'orient_face_hub')!
  const hubTargetIds = new Set(hub.choices.map((c) => c.targetId))
  const nodeIds = new Set(packet.nodes.map((n) => n.id))

  for (const face of GAME_MASTER_FACES) {
    // Each face should have at least one node reachable from the hub
    const faceNodeIds = packet.nodes
      .filter((n) => n.gameMasterFace === face)
      .map((n) => n.id)

    assert(faceNodeIds.length > 0, `Face ${face} should have nodes in the packet`)

    // The hub should target a node that belongs to this face
    const faceStartNode = faceNodeIds.find((id) => hubTargetIds.has(id))
    assert(
      faceStartNode !== undefined,
      `Hub should have a choice targeting a ${face} sub-packet node`
    )
  }
  console.log('✓ testFaceSubPacketsReachableFromHub')
}

/** Test: all 6 face sub-packets are present in the meta-packet */
function testAllSixFaceSubPacketsEmitted() {
  const packet = compileOrientationMetaPacket()
  const facesPresent = new Set(
    packet.nodes.filter((n) => n.gameMasterFace).map((n) => n.gameMasterFace!)
  )

  assertEqual(facesPresent.size, 6, 'All 6 faces should be represented in the packet nodes')
  for (const face of GAME_MASTER_FACES) {
    assert(facesPresent.has(face), `Face ${face} should be present in packet nodes`)
  }
  console.log('✓ testAllSixFaceSubPacketsEmitted')
}

/** Test: each face sub-packet terminal converges to orient_terminal */
function testFaceSubPacketTerminalsConverge() {
  const packet = compileOrientationMetaPacket()

  for (const face of GAME_MASTER_FACES) {
    const terminalId = faceSubPacketTerminalId(face)
    const terminal = packet.nodes.find((n) => n.id === terminalId)

    assert(terminal !== undefined, `Terminal node '${terminalId}' should exist in packet`)
    assert(
      terminal!.choices.length > 0,
      `Terminal '${terminalId}' should have choices (patched to converge)`
    )
    const convergesCorrectly = terminal!.choices.some((c) => c.targetId === 'orient_terminal')
    assert(
      convergesCorrectly,
      `Terminal '${terminalId}' should have a choice pointing to orient_terminal`
    )
  }
  console.log('✓ testFaceSubPacketTerminalsConverge')
}

/** Test: orient_terminal has no choices (dead end) */
function testOrientTerminalIsDeadEnd() {
  const packet = compileOrientationMetaPacket()
  const terminal = packet.nodes.find((n) => n.id === 'orient_terminal')
  assert(terminal !== undefined, 'orient_terminal should exist')
  assertEqual(terminal!.choices.length, 0, 'orient_terminal should have no choices (dead end)')
  console.log('✓ testOrientTerminalIsDeadEnd')
}

/** Test: enabledFaces filter restricts hub choices and emitted sub-packets */
function testEnabledFacesFilter() {
  const enabledFaces: GameMasterFace[] = ['shaman', 'challenger', 'sage']
  const packet = compileOrientationMetaPacket({ enabledFaces })
  const hub = packet.nodes.find((n) => n.id === 'orient_face_hub')!

  assertEqual(hub.choices.length, 3, 'Hub should have 3 choices when enabledFaces is limited')

  const facesPresent = new Set(
    packet.nodes.filter((n) => n.gameMasterFace).map((n) => n.gameMasterFace!)
  )
  assertEqual(facesPresent.size, 3, 'Only 3 face sub-packets should be emitted')
  assert(facesPresent.has('shaman'), 'shaman should be present')
  assert(facesPresent.has('challenger'), 'challenger should be present')
  assert(facesPresent.has('sage'), 'sage should be present')
  assert(!facesPresent.has('regent'), 'regent should NOT be present (not in enabledFaces)')
  console.log('✓ testEnabledFacesFilter')
}

/** Test: no duplicate node IDs in the compiled packet */
function testNoDuplicateNodeIds() {
  const packet = compileOrientationMetaPacket()
  const ids = packet.nodes.map((n) => n.id)
  const unique = new Set(ids)
  assertEqual(ids.length, unique.size, `Should have no duplicate node IDs. Total: ${ids.length}, Unique: ${unique.size}`)
  console.log('✓ testNoDuplicateNodeIds')
}

/** Test: all internal choice targets resolve to actual nodes */
function testAllChoiceTargetsResolvable() {
  const packet = compileOrientationMetaPacket()
  const nodeIds = new Set(packet.nodes.map((n) => n.id))
  const brokenLinks: string[] = []

  for (const node of packet.nodes) {
    for (const choice of node.choices) {
      if (!nodeIds.has(choice.targetId)) {
        brokenLinks.push(`${node.id} → ${choice.targetId}`)
      }
    }
  }

  assertEqual(
    brokenLinks.length,
    0,
    `All choice targets should resolve. Broken links:\n  ${brokenLinks.join('\n  ')}`
  )
  console.log('✓ testAllChoiceTargetsResolvable')
}

/** Test: getOrientationMetaPacketNodeIds returns all expected IDs */
function testGetOrientationMetaPacketNodeIds() {
  const packet = compileOrientationMetaPacket()
  const expectedIds = getOrientationMetaPacketNodeIds()
  const packetIds = new Set(packet.nodes.map((n) => n.id))

  for (const id of expectedIds) {
    assert(packetIds.has(id), `Expected node ID '${id}' should be in compiled packet`)
  }
  assertEqual(
    expectedIds.length,
    packet.nodes.length,
    'getOrientationMetaPacketNodeIds should return same count as compiled packet nodes'
  )
  console.log('✓ testGetOrientationMetaPacketNodeIds')
}

/** Test: FACE_TO_CANONICAL_MOVE_ID covers all 6 faces */
function testFaceToCanonicalMoveIdMapping() {
  for (const face of GAME_MASTER_FACES) {
    const moveId = FACE_TO_CANONICAL_MOVE_ID[face]
    assert(typeof moveId === 'string' && moveId.length > 0, `Face ${face} should have a canonical move ID`)
  }

  // Verify distinct WCGS stages are covered (not all faces map to same stage)
  const moveIds = Object.values(FACE_TO_CANONICAL_MOVE_ID)
  const uniqueMoveIds = new Set(moveIds)
  assert(uniqueMoveIds.size >= 4, 'At least 4 distinct canonical moves should be mapped')
  console.log('✓ testFaceToCanonicalMoveIdMapping')
}

/** Test: compileFaceSubPacketWithConvergence patches terminal correctly */
function testCompileFaceSubPacketWithConvergence() {
  for (const face of GAME_MASTER_FACES) {
    const { nodes, startNodeId } = compileFaceSubPacketWithConvergence(face, 'orient_terminal')
    const terminalId = faceSubPacketTerminalId(face)
    const terminal = nodes.find((n) => n.id === terminalId)

    assert(terminal !== undefined, `${face}: terminal node should exist`)
    assert(
      terminal!.choices.some((c) => c.targetId === 'orient_terminal'),
      `${face}: terminal should point to orient_terminal`
    )
    assert(typeof startNodeId === 'string' && startNodeId.length > 0, `${face}: startNodeId should be non-empty`)
    // All face nodes should have gameMasterFace set
    for (const node of nodes) {
      assertEqual(node.gameMasterFace, face, `${face}: all nodes should have gameMasterFace=${face}`)
    }
  }
  console.log('✓ testCompileFaceSubPacketWithConvergence')
}

/** Test: instantiateAllFaceSubPackets returns nodes for all 6 faces */
function testInstantiateAllFaceSubPackets() {
  const nodes = instantiateAllFaceSubPackets(GAME_MASTER_FACES, 'orient_terminal')
  const facesPresent = new Set(nodes.filter((n) => n.gameMasterFace).map((n) => n.gameMasterFace!))

  assertEqual(facesPresent.size, 6, 'instantiateAllFaceSubPackets should cover all 6 faces')
  console.log('✓ testInstantiateAllFaceSubPackets')
}

/** Test: faceSubPacketPrefix and faceSubPacketTerminalId helpers */
function testFaceSubPacketHelpers() {
  assertEqual(faceSubPacketPrefix('shaman'), 'orient_shaman', 'shaman prefix')
  assertEqual(faceSubPacketPrefix('sage'), 'orient_sage', 'sage prefix')
  assertEqual(faceSubPacketTerminalId('challenger'), 'orient_challenger_terminal', 'challenger terminal')
  assertEqual(faceSubPacketTerminalId('diplomat'), 'orient_diplomat_terminal', 'diplomat terminal')
  console.log('✓ testFaceSubPacketHelpers')
}

/** Test: meta-packet wiring is deterministic (same input → same output) */
function testDispatchDeterminism() {
  const packet1 = compileOrientationMetaPacket({ segment: 'player' })
  const packet2 = compileOrientationMetaPacket({ segment: 'player' })
  assertEqual(
    packet1.nodes.map((n) => n.id),
    packet2.nodes.map((n) => n.id),
    'compileOrientationMetaPacket should be deterministic'
  )
  console.log('✓ testDispatchDeterminism')
}

// ===========================================================================
// SECTION 2 — STATE MANAGEMENT TESTS (Sub-AC 4)
// ===========================================================================

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function testInitialState() {
  const state = createInitialMetaPacketState('test-packet-1')
  assertEqual(state.packetId, 'test-packet-1', 'packetId should match')
  assert(!state.completedAt, 'completedAt should be undefined initially')

  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of faces) {
    assertEqual(state.subPackets[face].status, 'pending', `${face} should be pending initially`)
    assert(!state.subPackets[face].completedAt, `${face} completedAt should be undefined initially`)
  }

  console.log('✓ testInitialState')
}

function testSubPacketCount() {
  assertEqual(ORIENTATION_SUB_PACKET_COUNT, 6, 'Should have exactly 6 sub-packets')
  assertEqual(ORIENTATION_SUB_PACKET_FACES.length, 6, 'ORIENTATION_SUB_PACKET_FACES should have 6 entries')
  console.log('✓ testSubPacketCount')
}

function testStartSubPacket() {
  let state = createInitialMetaPacketState('test-start')
  state = startSubPacket(state, 'shaman', '2026-01-01T00:00:00.000Z')

  assertEqual(state.subPackets['shaman'].status, 'in_progress', 'shaman should be in_progress after start')
  assertEqual(
    state.subPackets['shaman'].startedAt,
    '2026-01-01T00:00:00.000Z',
    'startedAt should be set'
  )
  // Other faces unchanged
  assertEqual(state.subPackets['challenger'].status, 'pending', 'challenger should still be pending')

  // Idempotent: starting again does not change state
  const state2 = startSubPacket(state, 'shaman', '2026-01-02T00:00:00.000Z')
  assertEqual(
    state2.subPackets['shaman'].startedAt,
    '2026-01-01T00:00:00.000Z',
    'startedAt should not change on idempotent start'
  )

  console.log('✓ testStartSubPacket')
}

function testMarkSubPacketComplete() {
  let state = createInitialMetaPacketState('test-complete')
  state = markSubPacketComplete(state, 'challenger', '2026-02-01T00:00:00.000Z')

  assertEqual(state.subPackets['challenger'].status, 'complete', 'challenger should be complete')
  assertEqual(
    state.subPackets['challenger'].completedAt,
    '2026-02-01T00:00:00.000Z',
    'completedAt should be set'
  )
  assert(!state.completedAt, 'meta-packet should NOT be complete yet (only 1 of 6 done)')

  // Idempotent: marking complete again should not change state
  const state2 = markSubPacketComplete(state, 'challenger', '2026-02-02T00:00:00.000Z')
  assertEqual(
    state2.subPackets['challenger'].completedAt,
    '2026-02-01T00:00:00.000Z',
    'completedAt should not change on idempotent markComplete'
  )
  assert(state2 === state || JSON.stringify(state2) === JSON.stringify(state), 'Idempotent markComplete should return equivalent state')

  console.log('✓ testMarkSubPacketComplete')
}

function testAnyOrderCompletion() {
  let state = createInitialMetaPacketState('test-any-order')

  // Complete in non-default order: sage → shaman → diplomat → architect → regent → challenger
  const completionOrder: GameMasterFace[] = ['sage', 'shaman', 'diplomat', 'architect', 'regent', 'challenger']
  const baseTime = new Date('2026-03-01T00:00:00.000Z').getTime()

  for (let i = 0; i < completionOrder.length; i++) {
    const face = completionOrder[i]!
    const timestamp = new Date(baseTime + i * 60_000).toISOString()
    state = markSubPacketComplete(state, face, timestamp)

    const expectedComplete = i + 1
    const { completed } = getMetaPacketProgress(state)
    assertEqual(completed, expectedComplete, `After completing ${face}, progress should be ${expectedComplete}`)

    if (i < completionOrder.length - 1) {
      assert(!state.completedAt, `Meta-packet should NOT be complete at step ${i + 1}`)
      assert(!isMetaPacketComplete(state), `isMetaPacketComplete should be false at step ${i + 1}`)
    }
  }

  // After all 6 are done
  assert(!!state.completedAt, 'Meta-packet completedAt should be set after all 6 complete')
  assert(isMetaPacketComplete(state), 'isMetaPacketComplete should be true after all 6 complete')

  console.log('✓ testAnyOrderCompletion')
}

function testMetaPacketCompletionTimestamp() {
  let state = createInitialMetaPacketState('test-timestamp')
  const faces = [...ORIENTATION_SUB_PACKET_FACES]

  // Complete first 5
  for (let i = 0; i < 5; i++) {
    state = markSubPacketComplete(state, faces[i]!, `2026-03-01T0${i}:00:00.000Z`)
  }
  assert(!state.completedAt, 'Meta-packet should not be complete with 5/6 done')

  // Complete the 6th
  const finalTimestamp = '2026-03-01T10:00:00.000Z'
  state = markSubPacketComplete(state, faces[5]!, finalTimestamp)

  assertEqual(
    state.completedAt,
    finalTimestamp,
    'Meta-packet completedAt should equal timestamp of the final completing sub-packet'
  )
  console.log('✓ testMetaPacketCompletionTimestamp')
}

function testGetCompletedSubPackets() {
  let state = createInitialMetaPacketState('test-query-completed')

  // Empty initially
  assertEqual(getCompletedSubPackets(state).length, 0, 'No completed sub-packets initially')

  state = markSubPacketComplete(state, 'regent', '2026-03-01T01:00:00.000Z')
  state = markSubPacketComplete(state, 'sage', '2026-03-01T02:00:00.000Z')

  const completed = getCompletedSubPackets(state)
  assertEqual(completed.length, 2, 'Should have 2 completed sub-packets')
  // Should be sorted by completedAt
  assertEqual(completed[0], 'regent', 'regent completed first')
  assertEqual(completed[1], 'sage', 'sage completed second')

  console.log('✓ testGetCompletedSubPackets')
}

function testGetPendingSubPackets() {
  let state = createInitialMetaPacketState('test-query-pending')

  assertEqual(getPendingSubPackets(state).length, 6, 'All 6 pending initially')

  state = markSubPacketComplete(state, 'architect')
  const pending = getPendingSubPackets(state)
  assertEqual(pending.length, 5, 'Should have 5 pending after 1 complete')
  assert(!pending.includes('architect'), 'architect should not be in pending list')

  console.log('✓ testGetPendingSubPackets')
}

function testGetInProgressSubPackets() {
  let state = createInitialMetaPacketState('test-query-in-progress')

  assertEqual(getInProgressSubPackets(state).length, 0, 'No in_progress sub-packets initially')

  state = startSubPacket(state, 'diplomat')
  state = startSubPacket(state, 'shaman')

  assertEqual(getInProgressSubPackets(state).length, 2, 'Should have 2 in_progress sub-packets')
  assert(getInProgressSubPackets(state).includes('diplomat'), 'diplomat should be in_progress')
  assert(getInProgressSubPackets(state).includes('shaman'), 'shaman should be in_progress')

  // Completing one removes it from in_progress
  state = markSubPacketComplete(state, 'diplomat')
  assertEqual(getInProgressSubPackets(state).length, 1, 'Should have 1 in_progress after diplomat completes')
  assert(!getInProgressSubPackets(state).includes('diplomat'), 'diplomat should not be in_progress after completion')

  console.log('✓ testGetInProgressSubPackets')
}

function testProgressSummary() {
  let state = createInitialMetaPacketState('test-progress')

  let progress = getMetaPacketProgress(state)
  assertEqual(progress.completed, 0, 'Should start at 0')
  assertEqual(progress.total, 6, 'Total should be 6')
  assertEqual(progress.percentComplete, 0, 'Should be 0%')

  state = markSubPacketComplete(state, 'shaman')
  state = markSubPacketComplete(state, 'challenger')
  state = markSubPacketComplete(state, 'regent')

  progress = getMetaPacketProgress(state)
  assertEqual(progress.completed, 3, 'Should be 3 complete')
  assertEqual(progress.total, 6, 'Total should still be 6')
  assertEqual(progress.percentComplete, 50, 'Should be 50%')

  console.log('✓ testProgressSummary')
}

function testNoRegressionFromComplete() {
  let state = createInitialMetaPacketState('test-no-regression')
  state = markSubPacketComplete(state, 'sage', '2026-03-01T00:00:00.000Z')

  // Trying to start an already-complete sub-packet should not change status
  const stateAfterStart = startSubPacket(state, 'sage', '2026-03-02T00:00:00.000Z')
  assertEqual(
    stateAfterStart.subPackets['sage'].status,
    'complete',
    'Completed sub-packet should not regress to in_progress'
  )
  assertEqual(
    stateAfterStart.subPackets['sage'].completedAt,
    '2026-03-01T00:00:00.000Z',
    'completedAt should not change on start after complete'
  )

  console.log('✓ testNoRegressionFromComplete')
}

function testPureImmutability() {
  const state1 = createInitialMetaPacketState('test-immutable')
  const state2 = markSubPacketComplete(state1, 'diplomat')

  // Original state is unchanged
  assertEqual(state1.subPackets['diplomat'].status, 'pending', 'Original state should be unchanged')
  assertEqual(state2.subPackets['diplomat'].status, 'complete', 'New state should show complete')

  console.log('✓ testPureImmutability')
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

function runAll() {
  const tests = [
    // Dispatch / compile (Sub-AC 3)
    testCompileMetaPacketBasic,
    testMetaPacketStructureNodes,
    testDispatchHubChoices,
    testFaceSubPacketsReachableFromHub,
    testAllSixFaceSubPacketsEmitted,
    testFaceSubPacketTerminalsConverge,
    testOrientTerminalIsDeadEnd,
    testEnabledFacesFilter,
    testNoDuplicateNodeIds,
    testAllChoiceTargetsResolvable,
    testGetOrientationMetaPacketNodeIds,
    testFaceToCanonicalMoveIdMapping,
    testCompileFaceSubPacketWithConvergence,
    testInstantiateAllFaceSubPackets,
    testFaceSubPacketHelpers,
    testDispatchDeterminism,
    // State management (Sub-AC 4)
    testInitialState,
    testSubPacketCount,
    testStartSubPacket,
    testMarkSubPacketComplete,
    testAnyOrderCompletion,
    testMetaPacketCompletionTimestamp,
    testGetCompletedSubPackets,
    testGetPendingSubPackets,
    testGetInProgressSubPackets,
    testProgressSummary,
    testNoRegressionFromComplete,
    testPureImmutability,
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      test()
      passed++
    } catch (err) {
      console.error(`✗ ${test.name}: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

runAll()
