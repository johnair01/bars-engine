/**
 * Abandonment Detection & Resume Logic — Tests
 *
 * Verifies the pure functions in checkpoint.ts that implement Sub-AC 4c:
 *   - isSessionAbandoned()
 *   - getSessionAgeMs()
 *   - hasResumableProgress()
 *   - getPacketProgress()
 *   - deriveResumeNodeId()
 *   - buildResumeBanner()
 *   - buildResumeLabel()
 *   - classifySessionForResume()
 *
 * Run with: npx tsx src/lib/orientation-quest/__tests__/checkpoint-abandon-resume.test.ts
 *
 * All tests use wall-clock-independent `now` overrides so they pass at any time.
 */

import {
  ABANDONMENT_THRESHOLD_MS,
  isSessionAbandoned,
  getSessionAgeMs,
  hasResumableProgress,
  getPacketProgress,
  deriveResumeNodeId,
  buildResumeBanner,
  classifySessionForResume,
  serializePacket,
} from '../checkpoint'
import { makeOrientationMetaPacket, makeFaceSubPacket } from '../types'
import type { OrientationMetaPacket, FaceSubPacket } from '../types'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertEq<T>(actual: T, expected: T, message: string): void {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new Error(`Assertion failed: ${message}\n  actual:   ${a}\n  expected: ${e}`)
  }
}

/** Reference "now" used across all tests (wall-clock-independent). */
const NOW = new Date('2026-03-13T12:00:00.000Z')

/** 25 hours in ms — just past the default abandonment threshold. */
const PAST_THRESHOLD_MS = 25 * 60 * 60 * 1000

/** 1 hour in ms — well within the default threshold. */
const WITHIN_THRESHOLD_MS = 1 * 60 * 60 * 1000

/** Build a Date that is `offsetMs` before NOW. */
function timeAgo(offsetMs: number): Date {
  return new Date(NOW.getTime() - offsetMs)
}

/** Build an all-pending OrientationMetaPacket. */
function makeAllPendingPacket(): OrientationMetaPacket {
  return makeOrientationMetaPacket('test-packet-id', 'test-player-id', 'player_direct')
}

/**
 * Return a packet with one face set to the given state.
 * activeFace is set when state is 'in_progress'.
 */
function makePacketWithFaceState(
  face: GameMasterFace,
  state: FaceSubPacket['state'],
): OrientationMetaPacket {
  const base = makeAllPendingPacket()
  return {
    ...base,
    activeFace: state === 'in_progress' ? face : base.activeFace,
    faceSubPackets: {
      ...base.faceSubPackets,
      [face]: { ...makeFaceSubPacket(face), state },
    },
  }
}

// ---------------------------------------------------------------------------
// isSessionAbandoned
// ---------------------------------------------------------------------------

function testIsSessionAbandoned_withinThreshold_false() {
  const checkpointAt = timeAgo(WITHIN_THRESHOLD_MS)
  assert(!isSessionAbandoned('active', checkpointAt, NOW), 'Within threshold → not abandoned')
}

function testIsSessionAbandoned_pastThreshold_true() {
  const checkpointAt = timeAgo(PAST_THRESHOLD_MS)
  assert(isSessionAbandoned('active', checkpointAt, NOW), 'Past threshold → abandoned')
}

function testIsSessionAbandoned_submittedState_false() {
  // Submitted sessions are complete, not abandoned, regardless of age
  const checkpointAt = timeAgo(PAST_THRESHOLD_MS)
  assert(!isSessionAbandoned('submitted', checkpointAt, NOW), 'Submitted → never abandoned')
}

function testIsSessionAbandoned_closedState_false() {
  const checkpointAt = timeAgo(PAST_THRESHOLD_MS)
  assert(!isSessionAbandoned('closed', checkpointAt, NOW), 'Closed → never abandoned')
}

function testIsSessionAbandoned_customThreshold() {
  const twoHoursMs = 2 * 60 * 60 * 1000
  const threeHoursMs = 3 * 60 * 60 * 1000
  const checkpointAt = timeAgo(twoHoursMs)
  assert(
    !isSessionAbandoned('active', checkpointAt, NOW, threeHoursMs),
    'Custom 3-hour threshold: 2-hour age → not abandoned',
  )
}

function testIsSessionAbandoned_exactBoundary_false() {
  // Exactly at ABANDONMENT_THRESHOLD_MS — uses strict >, not >=
  const checkpointAt = timeAgo(ABANDONMENT_THRESHOLD_MS)
  assert(!isSessionAbandoned('active', checkpointAt, NOW), 'Exactly at boundary → not abandoned')
}

function testIsSessionAbandoned_isoStringInput() {
  const checkpointAt = timeAgo(PAST_THRESHOLD_MS).toISOString()
  assert(isSessionAbandoned('active', checkpointAt, NOW), 'Accepts ISO string for checkpointAt')
}

// ---------------------------------------------------------------------------
// getSessionAgeMs
// ---------------------------------------------------------------------------

function testGetSessionAgeMs_accuracy() {
  const checkpointAt = timeAgo(WITHIN_THRESHOLD_MS)
  const age = getSessionAgeMs(checkpointAt, NOW)
  assert(
    Math.abs(age - WITHIN_THRESHOLD_MS) < 100,
    `Age should be ≈ ${WITHIN_THRESHOLD_MS}ms, got ${age}ms`,
  )
}

// ---------------------------------------------------------------------------
// hasResumableProgress
// ---------------------------------------------------------------------------

function testHasResumableProgress_allPending_false() {
  assert(!hasResumableProgress(makeAllPendingPacket()), 'All pending → no resumable progress')
}

function testHasResumableProgress_inProgress_true() {
  assert(hasResumableProgress(makePacketWithFaceState('shaman', 'in_progress')), 'in_progress → has progress')
}

function testHasResumableProgress_complete_true() {
  assert(hasResumableProgress(makePacketWithFaceState('challenger', 'complete')), 'complete → has progress')
}

function testHasResumableProgress_onlySkipped_false() {
  // All other faces pending + one skipped — no content was authored
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    faceSubPackets: Object.fromEntries(
      (Object.keys(base.faceSubPackets) as GameMasterFace[]).map((f) => [
        f,
        { ...base.faceSubPackets[f], state: f === 'regent' ? 'skipped' : 'pending' } as FaceSubPacket,
      ]),
    ) as Record<GameMasterFace, FaceSubPacket>,
  }
  assert(!hasResumableProgress(packet), 'Only skipped + pending → no resumable progress')
}

// ---------------------------------------------------------------------------
// getPacketProgress
// ---------------------------------------------------------------------------

function testGetPacketProgress_allPending() {
  const p = getPacketProgress(makeAllPendingPacket())
  assertEq(p.pending, 6, 'All 6 pending')
  assertEq(p.completed, 0, 'Zero complete')
  assertEq(p.inProgress, 0, 'Zero in-progress')
  assertEq(p.skipped, 0, 'Zero skipped')
  assertEq(p.total, 6, 'Total = 6')
}

function testGetPacketProgress_mixed() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    faceSubPackets: {
      ...base.faceSubPackets,
      shaman: { ...base.faceSubPackets.shaman, state: 'complete' },
      challenger: { ...base.faceSubPackets.challenger, state: 'in_progress' },
      regent: { ...base.faceSubPackets.regent, state: 'skipped' },
    },
  }
  const p = getPacketProgress(packet)
  assertEq(p.completed, 1, 'One complete')
  assertEq(p.inProgress, 1, 'One in-progress')
  assertEq(p.skipped, 1, 'One skipped')
  assertEq(p.pending, 3, 'Three pending')
  assertEq(p.total, 6, 'Total = 6')
}

// ---------------------------------------------------------------------------
// deriveResumeNodeId
// ---------------------------------------------------------------------------

function testDeriveResumeNodeId_allPending_hub() {
  assertEq(deriveResumeNodeId(makeAllPendingPacket()), 'orient_face_hub', 'All pending → hub')
}

function testDeriveResumeNodeId_activeFaceInProgress_intro() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: 'shaman',
    faceSubPackets: {
      ...base.faceSubPackets,
      shaman: { ...base.faceSubPackets.shaman, state: 'in_progress' },
    },
  }
  assertEq(deriveResumeNodeId(packet), 'orient_shaman_shaman_intro', 'activeFace in_progress → intro')
}

function testDeriveResumeNodeId_inProgressNoActiveFace() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: null,
    faceSubPackets: {
      ...base.faceSubPackets,
      challenger: { ...base.faceSubPackets.challenger, state: 'in_progress' },
    },
  }
  assertEq(
    deriveResumeNodeId(packet),
    'orient_challenger_challenger_intro',
    'in_progress face without activeFace → intro',
  )
}

function testDeriveResumeNodeId_allComplete_terminal() {
  const base = makeAllPendingPacket()
  const allComplete = Object.fromEntries(
    (Object.keys(base.faceSubPackets) as GameMasterFace[]).map((f) => [
      f,
      { ...base.faceSubPackets[f], state: 'complete' } as FaceSubPacket,
    ]),
  ) as Record<GameMasterFace, FaceSubPacket>
  const packet = { ...base, faceSubPackets: allComplete }
  assertEq(deriveResumeNodeId(packet), 'orient_terminal', 'All complete → terminal')
}

// ---------------------------------------------------------------------------
// buildResumeBanner
// ---------------------------------------------------------------------------

function testBuildResumeBanner_allPending_notStarted() {
  const banner = buildResumeBanner(makeAllPendingPacket())
  assert(banner.toLowerCase().includes('not started'), 'All-pending → "not started" in banner')
}

function testBuildResumeBanner_activeFaceInProgress() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: 'diplomat',
    faceSubPackets: {
      ...base.faceSubPackets,
      diplomat: { ...base.faceSubPackets.diplomat, state: 'in_progress' },
    },
  }
  const banner = buildResumeBanner(packet)
  assert(banner.includes('Diplomat'), 'Active face name in banner')
  assert(banner.includes('partway'), '"partway" in banner')
}

function testBuildResumeBanner_someComplete() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: null,
    faceSubPackets: {
      ...base.faceSubPackets,
      shaman: { ...base.faceSubPackets.shaman, state: 'complete' },
      sage: { ...base.faceSubPackets.sage, state: 'complete' },
    },
  }
  const banner = buildResumeBanner(packet)
  assert(banner.includes('2 of 6'), 'Banner includes "2 of 6" count')
}

// ---------------------------------------------------------------------------
// classifySessionForResume
// ---------------------------------------------------------------------------

/** Minimal DB row factory. */
function makeRow(overrides: Partial<{
  sessionState: string
  checkpointAt: Date
  packetJson: string
  checkpointNodeId: string | null
  abandonedAt: Date | null
}> = {}) {
  return {
    id: 'row-1',
    sessionState: overrides.sessionState ?? 'active',
    checkpointAt: overrides.checkpointAt ?? timeAgo(WITHIN_THRESHOLD_MS),
    packetJson: overrides.packetJson ?? serializePacket(makeAllPendingPacket()),
    checkpointNodeId: overrides.checkpointNodeId !== undefined ? overrides.checkpointNodeId : null,
    abandonedAt: overrides.abandonedAt !== undefined ? overrides.abandonedAt : null,
  }
}

function testClassify_corruptJson_freshStart() {
  const result = classifySessionForResume(makeRow({ packetJson: 'bad-json' }), NOW)
  assertEq(result.outcome, 'fresh_start', 'Corrupt JSON → fresh_start (preserve sessionId)')
  assertEq(result.sessionId, 'row-1', 'sessionId preserved for corrupt JSON')
}

function testClassify_emptyPacketJson_freshStart() {
  const result = classifySessionForResume(makeRow({ packetJson: '' }), NOW)
  assertEq(result.outcome, 'fresh_start', 'Empty packetJson → fresh_start (likely write bug)')
  assertEq(result.sessionId, 'row-1', 'sessionId preserved for empty packetJson')
}

function testClassify_dbAbandonedFlag() {
  const row = makeRow({ sessionState: 'abandoned', abandonedAt: timeAgo(WITHIN_THRESHOLD_MS) })
  const result = classifySessionForResume(row, NOW)
  assertEq(result.outcome, 'abandoned', 'DB abandoned flag → abandoned')
  assertEq(result.sessionId, 'row-1', 'sessionId present')
}

function testClassify_timeBased_abandoned() {
  const row = makeRow({ checkpointAt: timeAgo(PAST_THRESHOLD_MS) })
  const result = classifySessionForResume(row, NOW)
  assertEq(result.outcome, 'abandoned', 'Time-based: past threshold → abandoned')
}

function testClassify_submitted_alreadyComplete() {
  const result = classifySessionForResume(makeRow({ sessionState: 'submitted' }), NOW)
  assertEq(result.outcome, 'already_complete', 'Submitted → already_complete')
}

function testClassify_closed_alreadyComplete() {
  const result = classifySessionForResume(makeRow({ sessionState: 'closed' }), NOW)
  assertEq(result.outcome, 'already_complete', 'Closed → already_complete')
}

function testClassify_allPendingActive_freshStart() {
  const result = classifySessionForResume(makeRow(), NOW)
  assertEq(result.outcome, 'fresh_start', 'Active all-pending → fresh_start')
  assertEq(result.sessionId, 'row-1', 'sessionId present for fresh_start')
}

function testClassify_inProgress_resumed() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: 'architect',
    faceSubPackets: {
      ...base.faceSubPackets,
      architect: { ...base.faceSubPackets.architect, state: 'in_progress' },
    },
  }
  const row = makeRow({ packetJson: serializePacket(packet) })
  const result = classifySessionForResume(row, NOW)
  assertEq(result.outcome, 'resumed', 'in_progress face → resumed')
  assert(result.packet !== undefined, 'packet populated')
  assertEq(result.checkpointNodeId, 'orient_architect_architect_intro', 'derived from activeFace')
  assert(typeof result.resumeBanner === 'string', 'resumeBanner is string')
  assert(typeof result.resumeLabel === 'string', 'resumeLabel is string')
}

function testClassify_dbCheckpointNodePriority() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: 'sage',
    faceSubPackets: {
      ...base.faceSubPackets,
      sage: { ...base.faceSubPackets.sage, state: 'in_progress' },
    },
  }
  const specificNode = 'orient_sage_sage_synthesis'
  const row = makeRow({ packetJson: serializePacket(packet), checkpointNodeId: specificNode })
  const result = classifySessionForResume(row, NOW)
  assertEq(result.outcome, 'resumed', 'Should resume')
  assertEq(result.checkpointNodeId, specificNode, 'DB node takes priority over derived')
}

function testClassify_oneComplete_resumedAtHub() {
  const base = makeAllPendingPacket()
  const packet: OrientationMetaPacket = {
    ...base,
    activeFace: null,
    faceSubPackets: {
      ...base.faceSubPackets,
      shaman: { ...base.faceSubPackets.shaman, state: 'complete' },
    },
  }
  const row = makeRow({ packetJson: serializePacket(packet) })
  const result = classifySessionForResume(row, NOW)
  assertEq(result.outcome, 'resumed', 'One complete → resumed')
  assertEq(result.checkpointNodeId, 'orient_face_hub', 'No in-progress → hub')
}

function testClassify_customThreshold() {
  // 5-hour old session, custom 3-hour threshold → abandoned
  const fiveHoursMs = 5 * 60 * 60 * 1000
  const threeHoursMs = 3 * 60 * 60 * 1000
  const row = makeRow({ checkpointAt: timeAgo(fiveHoursMs) })
  const result = classifySessionForResume(row, NOW, threeHoursMs)
  assertEq(result.outcome, 'abandoned', 'Custom 3-hour threshold: 5-hour age → abandoned')
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

const ALL_TESTS: [string, () => void][] = [
  // isSessionAbandoned
  ['isSessionAbandoned: within threshold → not abandoned', testIsSessionAbandoned_withinThreshold_false],
  ['isSessionAbandoned: past threshold → abandoned', testIsSessionAbandoned_pastThreshold_true],
  ['isSessionAbandoned: submitted → never abandoned', testIsSessionAbandoned_submittedState_false],
  ['isSessionAbandoned: closed → never abandoned', testIsSessionAbandoned_closedState_false],
  ['isSessionAbandoned: custom threshold', testIsSessionAbandoned_customThreshold],
  ['isSessionAbandoned: exactly at boundary → not abandoned', testIsSessionAbandoned_exactBoundary_false],
  ['isSessionAbandoned: accepts ISO string', testIsSessionAbandoned_isoStringInput],
  // getSessionAgeMs
  ['getSessionAgeMs: returns accurate age', testGetSessionAgeMs_accuracy],
  // hasResumableProgress
  ['hasResumableProgress: all pending → false', testHasResumableProgress_allPending_false],
  ['hasResumableProgress: in_progress → true', testHasResumableProgress_inProgress_true],
  ['hasResumableProgress: complete → true', testHasResumableProgress_complete_true],
  ['hasResumableProgress: only skipped → false', testHasResumableProgress_onlySkipped_false],
  // getPacketProgress
  ['getPacketProgress: all pending counts', testGetPacketProgress_allPending],
  ['getPacketProgress: mixed states', testGetPacketProgress_mixed],
  // deriveResumeNodeId
  ['deriveResumeNodeId: all pending → hub', testDeriveResumeNodeId_allPending_hub],
  ['deriveResumeNodeId: activeFace in_progress → intro', testDeriveResumeNodeId_activeFaceInProgress_intro],
  ['deriveResumeNodeId: in_progress without activeFace', testDeriveResumeNodeId_inProgressNoActiveFace],
  ['deriveResumeNodeId: all complete → terminal', testDeriveResumeNodeId_allComplete_terminal],
  // buildResumeBanner
  ['buildResumeBanner: all pending → not started', testBuildResumeBanner_allPending_notStarted],
  ['buildResumeBanner: activeFace in_progress', testBuildResumeBanner_activeFaceInProgress],
  ['buildResumeBanner: some complete → count', testBuildResumeBanner_someComplete],
  // classifySessionForResume
  ['classifySessionForResume: corrupt JSON → fresh_start', testClassify_corruptJson_freshStart],
  ['classifySessionForResume: empty packetJson → fresh_start', testClassify_emptyPacketJson_freshStart],
  ['classifySessionForResume: DB abandoned flag', testClassify_dbAbandonedFlag],
  ['classifySessionForResume: time-based abandonment', testClassify_timeBased_abandoned],
  ['classifySessionForResume: submitted → already_complete', testClassify_submitted_alreadyComplete],
  ['classifySessionForResume: closed → already_complete', testClassify_closed_alreadyComplete],
  ['classifySessionForResume: all-pending active → fresh_start', testClassify_allPendingActive_freshStart],
  ['classifySessionForResume: in_progress → resumed', testClassify_inProgress_resumed],
  ['classifySessionForResume: DB checkpointNodeId takes priority', testClassify_dbCheckpointNodePriority],
  ['classifySessionForResume: one complete → hub', testClassify_oneComplete_resumedAtHub],
  ['classifySessionForResume: custom threshold', testClassify_customThreshold],
]

let passed = 0
let failed = 0

console.log('\nOrientation Quest — Abandonment Detection & Resume Logic\n')

for (const [name, fn] of ALL_TESTS) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${(err as Error).message}`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
