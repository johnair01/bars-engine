/**
 * Alchemy Engine — Type & Phase-Lock Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/types.test.ts
 *
 * Validates:
 * - Phase ordering (intake → action → reflection)
 * - Phase-locked regulation advancement
 * - dissatisfied → neutral → satisfied (epiphany) end-to-end
 * - Vertical slice defaults (Challenger + Wake Up)
 */

import assert from 'node:assert'
import {
  ARC_PHASES,
  PHASE_REGULATION_MAP,
  PHASE_INDEX,
  VERTICAL_SLICE,
  isArcPhase,
  isRegulationState,
  nextPhase,
  canAdvancePhase,
  regulationAfterPhase,
  type RegulationState,
} from '../types'

// ---------------------------------------------------------------------------
// ARC_PHASES
// ---------------------------------------------------------------------------

assert.deepStrictEqual(ARC_PHASES, ['intake', 'action', 'reflection'], 'ARC_PHASES has 3 phases in order')

// ---------------------------------------------------------------------------
// VERTICAL_SLICE defaults
// ---------------------------------------------------------------------------

assert.strictEqual(VERTICAL_SLICE.face, 'challenger', 'Vertical slice face is Challenger')
assert.strictEqual(VERTICAL_SLICE.waveMove, 'wakeUp', 'Vertical slice wave is Wake Up')
assert.strictEqual(VERTICAL_SLICE.initialRegulation, 'dissatisfied', 'Arc starts dissatisfied')

// ---------------------------------------------------------------------------
// isArcPhase
// ---------------------------------------------------------------------------

assert.strictEqual(isArcPhase('intake'), true)
assert.strictEqual(isArcPhase('action'), true)
assert.strictEqual(isArcPhase('reflection'), true)
assert.strictEqual(isArcPhase('epiphany'), false, 'epiphany is not a phase')
assert.strictEqual(isArcPhase(null), false)
assert.strictEqual(isArcPhase(undefined), false)
assert.strictEqual(isArcPhase(42), false)

// ---------------------------------------------------------------------------
// isRegulationState
// ---------------------------------------------------------------------------

assert.strictEqual(isRegulationState('dissatisfied'), true)
assert.strictEqual(isRegulationState('neutral'), true)
assert.strictEqual(isRegulationState('satisfied'), true)
assert.strictEqual(isRegulationState('epiphany'), false)
assert.strictEqual(isRegulationState(''), false)

// ---------------------------------------------------------------------------
// nextPhase
// ---------------------------------------------------------------------------

assert.strictEqual(nextPhase('intake'), 'action', 'intake → action')
assert.strictEqual(nextPhase('action'), 'reflection', 'action → reflection')
assert.strictEqual(nextPhase('reflection'), null, 'reflection → null (arc complete)')

// ---------------------------------------------------------------------------
// PHASE_REGULATION_MAP
// ---------------------------------------------------------------------------

assert.deepStrictEqual(PHASE_REGULATION_MAP.intake, { from: 'dissatisfied', to: 'neutral' })
assert.deepStrictEqual(PHASE_REGULATION_MAP.action, { from: 'neutral', to: 'neutral' })
assert.deepStrictEqual(PHASE_REGULATION_MAP.reflection, { from: 'neutral', to: 'satisfied' })

// ---------------------------------------------------------------------------
// canAdvancePhase (phase-locked)
// ---------------------------------------------------------------------------

assert.strictEqual(canAdvancePhase('intake', 'dissatisfied'), true, 'intake: dissatisfied can advance')
assert.strictEqual(canAdvancePhase('intake', 'neutral'), false, 'intake: neutral blocked (phase-locked)')
assert.strictEqual(canAdvancePhase('action', 'neutral'), true, 'action: neutral can advance')
assert.strictEqual(canAdvancePhase('action', 'dissatisfied'), false, 'action: dissatisfied blocked')
assert.strictEqual(canAdvancePhase('reflection', 'neutral'), true, 'reflection: neutral can advance')
assert.strictEqual(canAdvancePhase('reflection', 'satisfied'), false, 'reflection: satisfied blocked (already done)')

// ---------------------------------------------------------------------------
// regulationAfterPhase
// ---------------------------------------------------------------------------

assert.strictEqual(regulationAfterPhase('intake'), 'neutral', 'intake → neutral')
assert.strictEqual(regulationAfterPhase('action'), 'neutral', 'action → neutral (stays)')
assert.strictEqual(regulationAfterPhase('reflection'), 'satisfied', 'reflection → satisfied (epiphany)')

// ---------------------------------------------------------------------------
// PHASE_INDEX ordering
// ---------------------------------------------------------------------------

assert.ok(PHASE_INDEX.intake < PHASE_INDEX.action, 'intake < action')
assert.ok(PHASE_INDEX.action < PHASE_INDEX.reflection, 'action < reflection')

// ---------------------------------------------------------------------------
// End-to-end: dissatisfied → neutral → satisfied
// ---------------------------------------------------------------------------

{
  let regulation: RegulationState = VERTICAL_SLICE.initialRegulation
  assert.strictEqual(regulation, 'dissatisfied', 'start: dissatisfied')

  // Phase 1: Intake
  assert.strictEqual(canAdvancePhase('intake', regulation), true)
  regulation = regulationAfterPhase('intake')
  assert.strictEqual(regulation, 'neutral', 'after intake: neutral')

  // Phase 2: Action
  assert.strictEqual(canAdvancePhase('action', regulation), true)
  regulation = regulationAfterPhase('action')
  assert.strictEqual(regulation, 'neutral', 'after action: neutral (capacity building)')

  // Phase 3: Reflection
  assert.strictEqual(canAdvancePhase('reflection', regulation), true)
  regulation = regulationAfterPhase('reflection')
  assert.strictEqual(regulation, 'satisfied', 'after reflection: satisfied = epiphany')

  // Arc complete
  assert.strictEqual(nextPhase('reflection'), null, 'arc complete')
}

// ---------------------------------------------------------------------------
// Phase skipping prevention
// ---------------------------------------------------------------------------

assert.strictEqual(canAdvancePhase('reflection', 'dissatisfied'), false, 'cannot skip to reflection from dissatisfied')
assert.strictEqual(canAdvancePhase('action', 'dissatisfied'), false, 'cannot skip to action from dissatisfied')

console.log('✅ All alchemy-engine type tests passed')
