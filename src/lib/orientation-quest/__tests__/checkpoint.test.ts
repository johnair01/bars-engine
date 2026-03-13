/**
 * Orientation Quest — Checkpoint Persistence (Sub-AC 4b) Tests
 *
 * Exercises the pure helper functions in checkpoint.ts:
 *   - serializePacket / deserializePacket round-trip
 *   - applyFaceEnter — pending → in_progress transition
 *   - applyPayloadPatch — scalar, array, deep-merge (bar_integration, quest_usage)
 *   - applyFaceSubmit — in_progress → complete + sessionState promotion
 *   - applyFaceSkip  — → skipped
 *   - applySessionClose — → closed
 *   - buildCheckpointPayload — shape + node-id routing
 *   - isSessionAbandoned — abandonment detection
 *   - hasResumableProgress, getPacketProgress — progress queries
 *   - deriveResumeNodeId — priority fallback chain
 *   - classifySessionForResume — full decision tree
 *
 * Run with:
 *   npx tsx src/lib/orientation-quest/__tests__/checkpoint.test.ts
 *
 * No DB, no network — all tests are pure / synchronous.
 */

import {
  serializePacket,
  deserializePacket,
  applyFaceEnter,
  applyPayloadPatch,
  applyFaceSubmit,
  applyFaceSkip,
  applySessionClose,
  buildCheckpointPayload,
  isSessionAbandoned,
  hasResumableProgress,
  getPacketProgress,
  deriveResumeNodeId,
  classifySessionForResume,
  CHECKPOINT_SEQUENCE,
  ABANDONMENT_THRESHOLD_MS,
} from '../checkpoint'
import { makeOrientationMetaPacket } from '../types'
import type { OrientationMetaPacket } from '../types'

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
    return
  }
  console.log(`  ✓ ${message}`)
  passed++
}

function describe(label: string, fn: () => void): void {
  console.log(`\n${label}`)
  fn()
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Returns a fresh packet with `createdAt` and `updatedAt` set to 1 second in
 * the past.  This guarantees that any transition that refreshes `updatedAt`
 * produces a timestamp AFTER the fixture value, making `updated !== original`
 * assertions reliable even when tests run within a single millisecond.
 */
function makePacket(): OrientationMetaPacket {
  const p = makeOrientationMetaPacket('pkt_test_001', 'player_001', 'player_direct')
  const oneSecondAgo = new Date(Date.now() - 1000).toISOString()
  return { ...p, createdAt: oneSecondAgo, updatedAt: oneSecondAgo }
}

// ---------------------------------------------------------------------------
// 1. Serialisation round-trip
// ---------------------------------------------------------------------------

describe('1. serializePacket / deserializePacket', () => {
  const packet = makePacket()
  const json = serializePacket(packet)

  assert(typeof json === 'string', 'serializePacket returns a string')
  assert(json.length > 0, 'serialized JSON is non-empty')

  const restored = deserializePacket(json)
  assert(restored.packetId === packet.packetId, 'packetId round-trips')
  assert(restored.playerId === packet.playerId, 'playerId round-trips')
  assert(restored.submissionPath === packet.submissionPath, 'submissionPath round-trips')
  assert(restored.sessionState === packet.sessionState, 'sessionState round-trips')
  assert(
    Object.keys(restored.faceSubPackets).length === 6,
    'all 6 face sub-packets round-trip',
  )
})

// ---------------------------------------------------------------------------
// 2. applyFaceEnter
// ---------------------------------------------------------------------------

describe('2. applyFaceEnter', () => {
  const packet = makePacket()

  describe('  2a. pending → in_progress', () => {
    const updated = applyFaceEnter(packet, 'shaman')
    assert(
      updated.faceSubPackets['shaman'].state === 'in_progress',
      'shaman state transitions to in_progress',
    )
    assert(updated.activeFace === 'shaman', 'activeFace set to shaman')
    assert(updated.updatedAt !== packet.updatedAt, 'updatedAt refreshed')
    assert(
      updated.faceSubPackets['challenger'].state === 'pending',
      'other faces remain pending',
    )
  })

  describe('  2b. already in_progress — no state regression', () => {
    const afterEnter = applyFaceEnter(packet, 'shaman')
    const afterSecondEnter = applyFaceEnter(afterEnter, 'shaman')
    assert(
      afterSecondEnter.faceSubPackets['shaman'].state === 'in_progress',
      'remains in_progress (no regression)',
    )
  })

  describe('  2c. missing face guard', () => {
    // Make a packet with only shaman enabled
    const subsetPacket = makeOrientationMetaPacket(
      'pkt_subset', 'player_001', 'player_direct', ['shaman'],
    )
    const result = applyFaceEnter(subsetPacket, 'challenger')
    assert(
      result === subsetPacket,
      'returns packet unchanged when face not in enabledFaces',
    )
  })
})

// ---------------------------------------------------------------------------
// 3. applyPayloadPatch
// ---------------------------------------------------------------------------

describe('3. applyPayloadPatch', () => {
  const packet = makePacket()

  describe('  3a. scalar field write', () => {
    const updated = applyPayloadPatch(packet, 'shaman', { description: 'A ritual crossing' })
    assert(
      updated.faceSubPackets['shaman'].payload.description === 'A ritual crossing',
      'description field set',
    )
    assert(
      updated.faceSubPackets['challenger'].payload.description === undefined,
      'other face payloads unaffected',
    )
  })

  describe('  3b. array field replaced (not merged)', () => {
    const base = applyPayloadPatch(packet, 'shaman', {
      safety_notes: ['note 1'],
    })
    const updated = applyPayloadPatch(base, 'shaman', {
      safety_notes: ['note 2', 'note 3'],
    })
    assert(
      JSON.stringify(updated.faceSubPackets['shaman'].payload.safety_notes) ===
        JSON.stringify(['note 2', 'note 3']),
      'array replaced entirely by new patch value',
    )
  })

  describe('  3c. bar_integration deep-merge', () => {
    const withRegent = applyPayloadPatch(packet, 'regent', {
      bar_integration: { creates_bar: true, bar_timing: 'pre_action' },
    })
    const withDiplomat = applyPayloadPatch(withRegent, 'regent', {
      bar_integration: { bar_prompt_template: 'Reflect on the relationship…' },
    })
    const barInt = withDiplomat.faceSubPackets['regent'].payload.bar_integration
    assert(barInt?.creates_bar === true, 'bar_integration.creates_bar preserved after diplomat patch')
    assert(barInt?.bar_timing === 'pre_action', 'bar_integration.bar_timing preserved')
    assert(
      barInt?.bar_prompt_template === 'Reflect on the relationship…',
      'bar_integration.bar_prompt_template added by diplomat',
    )
  })

  describe('  3d. quest_usage deep-merge', () => {
    const withRegent = applyPayloadPatch(packet, 'regent', {
      quest_usage: { quest_stage: 'reflection', is_required_for_full_arc: true },
    })
    const withSage = applyPayloadPatch(withRegent, 'regent', {
      quest_usage: { suggested_follow_up_moves: ['observe', 'name'] },
    })
    const qu = withSage.faceSubPackets['regent'].payload.quest_usage
    assert(qu?.quest_stage === 'reflection', 'quest_usage.quest_stage (regent) preserved after sage patch')
    assert(qu?.is_required_for_full_arc === true, 'quest_usage.is_required_for_full_arc preserved')
    assert(
      JSON.stringify(qu?.suggested_follow_up_moves) === JSON.stringify(['observe', 'name']),
      'quest_usage.suggested_follow_up_moves added by sage',
    )
  })

  describe('  3e. parent_move_id set-once semantics', () => {
    const withParent = applyPayloadPatch(packet, 'shaman', { parent_move_id: 'observe' })
    const tryOverwrite = applyPayloadPatch(withParent, 'shaman', { parent_move_id: 'name' })
    assert(
      tryOverwrite.faceSubPackets['shaman'].payload.parent_move_id === 'observe',
      'parent_move_id cannot be overwritten once set',
    )
  })
})

// ---------------------------------------------------------------------------
// 4. applyFaceSubmit
// ---------------------------------------------------------------------------

describe('4. applyFaceSubmit', () => {
  const inProgress = applyFaceEnter(makePacket(), 'shaman')

  describe('  4a. state → complete', () => {
    const submitted = applyFaceSubmit(inProgress, 'shaman', 'qp_proposal_001')
    assert(
      submitted.faceSubPackets['shaman'].state === 'complete',
      'shaman state → complete',
    )
    assert(
      submitted.faceSubPackets['shaman'].questProposalId === 'qp_proposal_001',
      'questProposalId recorded',
    )
    assert(
      submitted.faceSubPackets['shaman'].submittedAt !== undefined,
      'submittedAt stamped',
    )
  })

  describe('  4b. sessionState → submitted when first face completes', () => {
    const submitted = applyFaceSubmit(inProgress, 'shaman', 'qp_proposal_001')
    assert(submitted.sessionState === 'submitted', 'sessionState → submitted')
  })

  describe('  4c. closed session state preserved', () => {
    const closed = applySessionClose(inProgress)
    const submitted = applyFaceSubmit(closed, 'shaman', 'qp_proposal_002')
    assert(submitted.sessionState === 'closed', 'closed sessionState not overwritten by submit')
  })
})

// ---------------------------------------------------------------------------
// 5. applyFaceSkip
// ---------------------------------------------------------------------------

describe('5. applyFaceSkip', () => {
  const packet = makePacket()
  const skipped = applyFaceSkip(packet, 'diplomat')
  assert(
    skipped.faceSubPackets['diplomat'].state === 'skipped',
    'diplomat state → skipped',
  )
  assert(
    skipped.faceSubPackets['shaman'].state === 'pending',
    'other faces remain pending',
  )
  assert(skipped.updatedAt !== packet.updatedAt, 'updatedAt refreshed on skip')
})

// ---------------------------------------------------------------------------
// 6. applySessionClose
// ---------------------------------------------------------------------------

describe('6. applySessionClose', () => {
  // Re-age updatedAt so the transition is guaranteed to produce a different timestamp
  const rawPacket = applyFaceEnter(makePacket(), 'shaman')
  const packet = { ...rawPacket, updatedAt: new Date(Date.now() - 1000).toISOString() }
  const closed = applySessionClose(packet)
  assert(closed.sessionState === 'closed', 'sessionState → closed')
  assert(closed.activeFace === null, 'activeFace cleared')
  assert(closed.updatedAt !== packet.updatedAt, 'updatedAt refreshed on close')
})

// ---------------------------------------------------------------------------
// 7. buildCheckpointPayload
// ---------------------------------------------------------------------------

describe('7. buildCheckpointPayload', () => {
  const packet = makePacket()

  describe('  7a. SESSION_INIT — no nodeId', () => {
    const payload = buildCheckpointPayload(packet, 'SESSION_INIT', { currentNodeId: 'some_node' })
    assert(payload.lastCheckpoint === 'SESSION_INIT', 'lastCheckpoint = SESSION_INIT')
    assert(payload.checkpointNodeId === null, 'checkpointNodeId null for session-level checkpoint')
    assert(payload.abandonedAt === null, 'abandonedAt null for normal writes')
  })

  describe('  7b. FACE_ENTER — nodeId propagated', () => {
    const payload = buildCheckpointPayload(packet, 'FACE_ENTER', {
      currentNodeId: 'orient_shaman_shaman_intro',
    })
    assert(payload.lastCheckpoint === 'FACE_ENTER', 'lastCheckpoint = FACE_ENTER')
    assert(
      payload.checkpointNodeId === 'orient_shaman_shaman_intro',
      'checkpointNodeId propagated from currentNodeId',
    )
  })

  describe('  7c. SESSION_CLOSE — no nodeId', () => {
    const payload = buildCheckpointPayload(packet, 'SESSION_CLOSE', {
      currentNodeId: 'orient_shaman_shaman_safety',
    })
    assert(payload.checkpointNodeId === null, 'SESSION_CLOSE always has null checkpointNodeId')
  })

  describe('  7d. packet fields mirrored', () => {
    const payload = buildCheckpointPayload(packet, 'SESSION_INIT')
    assert(payload.packetId === packet.packetId, 'packetId mirrored')
    assert(payload.playerId === packet.playerId, 'playerId mirrored')
    assert(payload.sessionState === packet.sessionState, 'sessionState mirrored')
    assert(payload.submissionPath === packet.submissionPath, 'submissionPath mirrored')
    assert(typeof payload.packetJson === 'string', 'packetJson is a string')
  })
})

// ---------------------------------------------------------------------------
// 8. CHECKPOINT_SEQUENCE constant
// ---------------------------------------------------------------------------

describe('8. CHECKPOINT_SEQUENCE', () => {
  assert(Array.isArray(CHECKPOINT_SEQUENCE), 'CHECKPOINT_SEQUENCE is an array')
  assert(CHECKPOINT_SEQUENCE.length === 6, 'exactly 6 named checkpoints')
  assert(CHECKPOINT_SEQUENCE[0] === 'SESSION_INIT', 'first checkpoint is SESSION_INIT')
  assert(CHECKPOINT_SEQUENCE[5] === 'SESSION_CLOSE', 'last checkpoint is SESSION_CLOSE')
})

// ---------------------------------------------------------------------------
// 9. isSessionAbandoned
// ---------------------------------------------------------------------------

describe('9. isSessionAbandoned', () => {
  const freshDate = new Date()
  const oldDate = new Date(Date.now() - ABANDONMENT_THRESHOLD_MS - 1000)
  const now = new Date()

  assert(
    !isSessionAbandoned('active', freshDate, now),
    'fresh active session is NOT abandoned',
  )
  assert(
    isSessionAbandoned('active', oldDate, now),
    'stale active session IS abandoned',
  )
  assert(
    !isSessionAbandoned('submitted', oldDate, now),
    'submitted session is never abandoned',
  )
  assert(
    !isSessionAbandoned('closed', oldDate, now),
    'closed session is never abandoned',
  )
})

// ---------------------------------------------------------------------------
// 10. hasResumableProgress / getPacketProgress
// ---------------------------------------------------------------------------

describe('10. hasResumableProgress + getPacketProgress', () => {
  const fresh = makePacket()
  assert(!hasResumableProgress(fresh), 'all-pending session has no resumable progress')

  const withInProgress = applyFaceEnter(fresh, 'shaman')
  assert(hasResumableProgress(withInProgress), 'in_progress face gives resumable progress')

  const progress = getPacketProgress(withInProgress)
  assert(progress.inProgress === 1, 'inProgress count = 1')
  assert(progress.pending === 5, 'pending count = 5')
  assert(progress.completed === 0, 'completed count = 0')
  assert(progress.total === 6, 'total count = 6')

  const withComplete = applyFaceSubmit(withInProgress, 'shaman', 'qp_001')
  const p2 = getPacketProgress(withComplete)
  assert(p2.completed === 1, 'completed count = 1 after submit')
  assert(p2.inProgress === 0, 'inProgress count = 0 after submit')
})

// ---------------------------------------------------------------------------
// 11. deriveResumeNodeId
// ---------------------------------------------------------------------------

describe('11. deriveResumeNodeId', () => {
  describe('  11a. activeFace in_progress → face intro node', () => {
    const packet = applyFaceEnter(makePacket(), 'challenger')
    const node = deriveResumeNodeId(packet)
    assert(node === 'orient_challenger_challenger_intro', 'resumes at challenger intro')
  })

  describe('  11b. no activeFace, any in_progress → first in_progress face intro', () => {
    const packet = applyFaceEnter(makePacket(), 'regent')
    const noActive = { ...packet, activeFace: null }
    const node = deriveResumeNodeId(noActive)
    assert(node === 'orient_regent_regent_intro', 'resumes at regent intro')
  })

  describe('  11c. all pending → face hub', () => {
    const node = deriveResumeNodeId(makePacket())
    assert(node === 'orient_face_hub', 'resumes at face hub when all pending')
  })

  describe('  11d. all complete/skipped → terminal', () => {
    let packet = makePacket()
    for (const face of ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const) {
      packet = applyFaceSkip(packet, face)
    }
    const node = deriveResumeNodeId(packet)
    assert(node === 'orient_terminal', 'resumes at terminal when all done')
  })
})

// ---------------------------------------------------------------------------
// 12. classifySessionForResume
// ---------------------------------------------------------------------------

describe('12. classifySessionForResume', () => {
  const now = new Date()
  const freshDate = new Date(now.getTime() - 1000)
  const oldDate = new Date(now.getTime() - ABANDONMENT_THRESHOLD_MS - 5000)

  const inProgressPacket = applyFaceEnter(makePacket(), 'shaman')
  const packetJson = serializePacket(inProgressPacket)
  const freshPacketJson = serializePacket(makePacket()) // all pending

  describe('  12a. already abandoned (DB flag)', () => {
    const result = classifySessionForResume({
      id: 'sess_001', sessionState: 'active',
      checkpointAt: freshDate, packetJson,
      checkpointNodeId: null, abandonedAt: new Date(),
    })
    assert(result.outcome === 'abandoned', 'explicit abandonedAt → abandoned')
  })

  describe('  12b. submitted session → already_complete', () => {
    const result = classifySessionForResume({
      id: 'sess_002', sessionState: 'submitted',
      checkpointAt: freshDate, packetJson,
      checkpointNodeId: null, abandonedAt: null,
    })
    assert(result.outcome === 'already_complete', 'submitted → already_complete')
  })

  describe('  12c. time-based abandonment', () => {
    const result = classifySessionForResume({
      id: 'sess_003', sessionState: 'active',
      checkpointAt: oldDate, packetJson,
      checkpointNodeId: null, abandonedAt: null,
    }, now)
    assert(result.outcome === 'abandoned', 'stale active session → abandoned')
  })

  describe('  12d. all-pending → fresh_start', () => {
    const result = classifySessionForResume({
      id: 'sess_004', sessionState: 'active',
      checkpointAt: freshDate, packetJson: freshPacketJson,
      checkpointNodeId: null, abandonedAt: null,
    })
    assert(result.outcome === 'fresh_start', 'no progress → fresh_start')
  })

  describe('  12e. in_progress → resumed with packet + nodeId', () => {
    const result = classifySessionForResume({
      id: 'sess_005', sessionState: 'active',
      checkpointAt: freshDate, packetJson,
      checkpointNodeId: 'orient_shaman_shaman_description', abandonedAt: null,
    })
    assert(result.outcome === 'resumed', 'in_progress active session → resumed')
    assert(result.packet !== undefined, 'packet returned on resume')
    assert(
      result.checkpointNodeId === 'orient_shaman_shaman_description',
      'DB-recorded nodeId takes priority over derived',
    )
    assert(typeof result.resumeBanner === 'string', 'resumeBanner is a string')
    assert(typeof result.resumeLabel === 'string', 'resumeLabel is a string')
    assert(result.sessionId === 'sess_005', 'sessionId returned')
  })

  describe('  12f. resumed — no DB nodeId → derived nodeId used', () => {
    const result = classifySessionForResume({
      id: 'sess_006', sessionState: 'active',
      checkpointAt: freshDate, packetJson,
      checkpointNodeId: null, abandonedAt: null,
    })
    assert(result.outcome === 'resumed', 'resumed without DB nodeId')
    assert(
      result.checkpointNodeId === 'orient_shaman_shaman_intro',
      'derived nodeId used when DB nodeId is null',
    )
  })
})

// ---------------------------------------------------------------------------
// Final summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(60)}`)
console.log(`checkpoint.test.ts — ${passed} passed, ${failed} failed`)
console.log('─'.repeat(60))

if (failed > 0) {
  process.exit(1)
}
