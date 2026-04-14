/**
 * Action Phase Choice Handler — Validation Unit Tests
 *
 * Tests the pure validation logic for the Action phase choice handler:
 * - ChallengerMoveId validation
 * - Phase-locked state validation (canAdvancePhase)
 * - CHALLENGER_MOVE_META correctness
 *
 * These tests exercise the validation functions used by completeActionPhase()
 * without requiring database access or authentication.
 *
 * Run: npx tsx src/lib/alchemy-engine/__tests__/action-phase-validation.test.ts
 */

import {
  isChallengerMoveId,
  CHALLENGER_MOVE_IDS,
  CHALLENGER_MOVE_META,
  canAdvancePhase,
  PHASE_REGULATION_MAP,
  regulationAfterPhase,
  nextPhase,
} from '../types'

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${msg}`)
}

// ─── ChallengerMoveId validation ────────────────────────────────────────────

assert(isChallengerMoveId('issue_challenge') === true, 'should accept issue_challenge')
assert(isChallengerMoveId('propose_move') === true, 'should accept propose_move')

assert(isChallengerMoveId('invalid_move') === false, 'should reject invalid_move')
assert(isChallengerMoveId('') === false, 'should reject empty string')
assert(isChallengerMoveId(null) === false, 'should reject null')
assert(isChallengerMoveId(undefined) === false, 'should reject undefined')
assert(isChallengerMoveId(42) === false, 'should reject number')
assert(isChallengerMoveId('shaman_bless') === false, 'should reject shaman_bless')

assert(CHALLENGER_MOVE_IDS.length === 2, 'should have exactly 2 valid moves for vertical slice')

// ─── CHALLENGER_MOVE_META correctness ───────────────────────────────────────

for (const moveId of CHALLENGER_MOVE_IDS) {
  const meta = CHALLENGER_MOVE_META[moveId]
  assert(meta !== undefined, `metadata should exist for ${moveId}`)
  assert(!!meta.canonicalMoveId, `${moveId} should have canonicalMoveId`)
  assert(!!meta.title, `${moveId} should have title`)
  assert(typeof meta.energyDelta === 'number', `${moveId} energyDelta should be number`)
  assert(!!meta.element, `${moveId} should have element`)
  assert(!!meta.narrative, `${moveId} should have narrative`)
}

// issue_challenge maps to fire_transcend
const issueMeta = CHALLENGER_MOVE_META.issue_challenge
assert(issueMeta.canonicalMoveId === 'fire_transcend', 'issue_challenge → fire_transcend')
assert(issueMeta.element === 'fire', 'issue_challenge element = fire')
assert(issueMeta.energyDelta === 2, 'issue_challenge energyDelta = 2')

// propose_move maps to wood_fire
const proposeMeta = CHALLENGER_MOVE_META.propose_move
assert(proposeMeta.canonicalMoveId === 'wood_fire', 'propose_move → wood_fire')
assert(proposeMeta.element === 'fire', 'propose_move element = fire')
assert(proposeMeta.energyDelta === 1, 'propose_move energyDelta = 1')

// ─── Phase-locked state validation for Action phase ─────────────────────────

assert(canAdvancePhase('action', 'neutral') === true, 'action + neutral → can advance')
assert(canAdvancePhase('action', 'dissatisfied') === false, 'action + dissatisfied → blocked')
assert(canAdvancePhase('action', 'satisfied') === false, 'action + satisfied → blocked')
assert(canAdvancePhase('intake', 'neutral') === false, 'intake + neutral → blocked')

assert(regulationAfterPhase('action') === 'neutral', 'action regulation stays neutral')
assert(nextPhase('action') === 'reflection', 'action advances to reflection')

const actionMap = PHASE_REGULATION_MAP.action
assert(actionMap.from === 'neutral', 'PHASE_REGULATION_MAP action.from = neutral')
assert(actionMap.to === 'neutral', 'PHASE_REGULATION_MAP action.to = neutral')

// ─── Full arc phase sequence validation ─────────────────────────────────────

// Phase 1: Intake
assert(canAdvancePhase('intake', 'dissatisfied') === true, 'intake + dissatisfied → advance')
assert(regulationAfterPhase('intake') === 'neutral', 'intake → neutral')
assert(nextPhase('intake') === 'action', 'intake → action')

// Phase 2: Action
assert(canAdvancePhase('action', 'neutral') === true, 'action + neutral → advance')
assert(regulationAfterPhase('action') === 'neutral', 'action → neutral')
assert(nextPhase('action') === 'reflection', 'action → reflection')

// Phase 3: Reflection
assert(canAdvancePhase('reflection', 'neutral') === true, 'reflection + neutral → advance')
assert(regulationAfterPhase('reflection') === 'satisfied', 'reflection → satisfied')
assert(nextPhase('reflection') === null, 'reflection → null (arc complete)')

console.log('✓ action-phase-validation: all assertions passed')
