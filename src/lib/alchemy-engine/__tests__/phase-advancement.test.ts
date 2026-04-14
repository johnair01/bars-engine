/**
 * Phase-Locked State Advancement — Unit Tests
 *
 * Tests the core phase advancement logic that enforces:
 *   - Regulation advances ONLY on valid phase completion
 *   - dissatisfied → neutral occurs on Intake completion
 *   - neutral → neutral on Action completion (capacity building)
 *   - neutral → satisfied on Reflection completion (epiphany)
 *   - Out-of-order transitions are blocked (phase-locked)
 *
 * AC 2: Phase-locked state advancement logic that transitions
 *        player state from dissatisfied→neutral upon valid Action phase completion.
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/phase-advancement.test.ts
 */

import assert from 'node:assert'
import {
  validatePhaseAdvancement,
  validateActionPhaseCompletion,
  validateIntakePhaseCompletion,
  validateReflectionPhaseCompletion,
  computeTransition,
  assertPhaseIs,
  assertRegulationIs,
  hasCompletedPhase,
  describeArcProgress,
  computeArcTrajectory,
  PhaseAdvancementError,
} from '../phase-advancement'
import {
  type ArcPhase,
  type RegulationState,
  PHASE_REGULATION_MAP,
  VERTICAL_SLICE,
  canAdvancePhase,
} from '../types'

// ─── validatePhaseAdvancement (core gate) ──────────────────────────────────

// allows intake advancement when dissatisfied
{
  const result = validatePhaseAdvancement('intake', 'dissatisfied')
  assert.strictEqual(result.valid, true, 'intake + dissatisfied should be valid')
  assert.strictEqual(result.currentPhase, 'intake')
  assert.strictEqual(result.currentRegulation, 'dissatisfied')
  assert.strictEqual(result.requiredRegulation, 'dissatisfied')
}

// allows action advancement when neutral
{
  const result = validatePhaseAdvancement('action', 'neutral')
  assert.strictEqual(result.valid, true, 'action + neutral should be valid')
  assert.strictEqual(result.currentPhase, 'action')
  assert.strictEqual(result.requiredRegulation, 'neutral')
}

// allows reflection advancement when neutral
{
  const result = validatePhaseAdvancement('reflection', 'neutral')
  assert.strictEqual(result.valid, true, 'reflection + neutral should be valid')
}

// rejects when no active phase
{
  const result = validatePhaseAdvancement(null, 'dissatisfied')
  assert.strictEqual(result.valid, false, 'null phase should be invalid')
  assert.ok(result.reason?.includes('No active arc phase'), 'should mention no active phase')
}

// rejects intake with neutral regulation (phase-locked)
{
  const result = validatePhaseAdvancement('intake', 'neutral')
  assert.strictEqual(result.valid, false, 'intake + neutral should be invalid (phase-locked)')
  assert.ok(result.reason?.includes("requires regulation 'dissatisfied'"), 'should explain required regulation')
  assert.ok(result.reason?.includes("current regulation is 'neutral'"), 'should show current regulation')
}

// rejects action with dissatisfied regulation (phase-locked)
{
  const result = validatePhaseAdvancement('action', 'dissatisfied')
  assert.strictEqual(result.valid, false, 'action + dissatisfied should be invalid')
  assert.ok(result.reason?.includes("requires regulation 'neutral'"))
}

// rejects action with satisfied regulation
{
  const result = validatePhaseAdvancement('action', 'satisfied')
  assert.strictEqual(result.valid, false, 'action + satisfied should be invalid')
}

// rejects reflection with dissatisfied regulation
{
  const result = validatePhaseAdvancement('reflection', 'dissatisfied')
  assert.strictEqual(result.valid, false, 'reflection + dissatisfied should be invalid')
}

// rejects reflection with satisfied regulation (already done)
{
  const result = validatePhaseAdvancement('reflection', 'satisfied')
  assert.strictEqual(result.valid, false, 'reflection + satisfied should be invalid (already done)')
}

console.log('✅ validatePhaseAdvancement: all tests passed')

// ─── validateActionPhaseCompletion ─────────────────────────────────────────

// validates action phase with neutral regulation (happy path)
{
  const result = validateActionPhaseCompletion('action', 'neutral')
  assert.strictEqual(result.valid, true, 'action phase completion should be valid with neutral')
  assert.strictEqual(result.currentPhase, 'action')
  assert.strictEqual(result.requiredRegulation, 'neutral')
}

// rejects when still in intake phase
{
  const result = validateActionPhaseCompletion('intake', 'dissatisfied')
  assert.strictEqual(result.valid, false)
  assert.ok(result.reason?.includes('Still in intake phase'), 'should explain still in intake')
  assert.ok(result.reason?.includes('dissatisfied to neutral'), 'should mention required transition')
}

// rejects when already in reflection phase
{
  const result = validateActionPhaseCompletion('reflection', 'neutral')
  assert.strictEqual(result.valid, false)
  assert.ok(result.reason?.includes('Already past action phase'))
}

// rejects when no arc is active
{
  const result = validateActionPhaseCompletion(null, 'neutral')
  assert.strictEqual(result.valid, false)
  assert.ok(result.reason?.includes('No active arc phase'))
}

// rejects action phase with dissatisfied regulation (intake not completed)
{
  const result = validateActionPhaseCompletion('action', 'dissatisfied')
  assert.strictEqual(result.valid, false, 'action + dissatisfied proves intake not done')
  assert.ok(result.reason?.includes("requires regulation 'neutral'"))
}

// rejects action phase with satisfied regulation
{
  const result = validateActionPhaseCompletion('action', 'satisfied')
  assert.strictEqual(result.valid, false)
}

console.log('✅ validateActionPhaseCompletion: all tests passed')

// ─── validateIntakePhaseCompletion ─────────────────────────────────────────

{
  const result = validateIntakePhaseCompletion('intake', 'dissatisfied')
  assert.strictEqual(result.valid, true)
}

{
  const result = validateIntakePhaseCompletion('action', 'neutral')
  assert.strictEqual(result.valid, false)
  assert.ok(result.reason?.includes("current phase is 'action'"))
}

{
  const result = validateIntakePhaseCompletion('intake', 'neutral')
  assert.strictEqual(result.valid, false)
}

{
  const result = validateIntakePhaseCompletion(null, 'dissatisfied')
  assert.strictEqual(result.valid, false)
  assert.ok(result.reason?.includes('No active arc phase'))
}

console.log('✅ validateIntakePhaseCompletion: all tests passed')

// ─── validateReflectionPhaseCompletion ─────────────────────────────────────

{
  const result = validateReflectionPhaseCompletion('reflection', 'neutral')
  assert.strictEqual(result.valid, true)
}

{
  const result = validateReflectionPhaseCompletion('action', 'neutral')
  assert.strictEqual(result.valid, false)
}

{
  const result = validateReflectionPhaseCompletion(null, 'neutral')
  assert.strictEqual(result.valid, false)
}

console.log('✅ validateReflectionPhaseCompletion: all tests passed')

// ─── computeTransition ────────────────────────────────────────────────────

// intake → action transition (dissatisfied → neutral)
{
  const t = computeTransition('intake', 'dissatisfied')
  assert.strictEqual(t.fromPhase, 'intake')
  assert.strictEqual(t.toPhase, 'action')
  assert.strictEqual(t.fromRegulation, 'dissatisfied')
  assert.strictEqual(t.toRegulation, 'neutral')
  assert.strictEqual(t.arcComplete, false)
}

// action → reflection transition (neutral → neutral)
{
  const t = computeTransition('action', 'neutral')
  assert.strictEqual(t.fromPhase, 'action')
  assert.strictEqual(t.toPhase, 'reflection')
  assert.strictEqual(t.fromRegulation, 'neutral')
  assert.strictEqual(t.toRegulation, 'neutral')
  assert.strictEqual(t.arcComplete, false)
}

// reflection → complete transition (neutral → satisfied)
{
  const t = computeTransition('reflection', 'neutral')
  assert.strictEqual(t.fromPhase, 'reflection')
  assert.strictEqual(t.toPhase, null)
  assert.strictEqual(t.fromRegulation, 'neutral')
  assert.strictEqual(t.toRegulation, 'satisfied')
  assert.strictEqual(t.arcComplete, true)
}

// throws on invalid state
{
  assert.throws(
    () => computeTransition('action', 'dissatisfied'),
    /invalid state/i,
    'should throw on invalid state',
  )
}

// includes a timestamp
{
  const before = new Date()
  const t = computeTransition('intake', 'dissatisfied')
  const after = new Date()
  assert.ok(t.timestamp.getTime() >= before.getTime(), 'timestamp should be >= before')
  assert.ok(t.timestamp.getTime() <= after.getTime(), 'timestamp should be <= after')
}

console.log('✅ computeTransition: all tests passed')

// ─── assertPhaseIs ────────────────────────────────────────────────────────

// does not throw when phase matches
assertPhaseIs('action', 'action')
assertPhaseIs('intake', 'intake')
assertPhaseIs('reflection', 'reflection')

// throws PhaseAdvancementError when phase does not match
{
  let caught = false
  try { assertPhaseIs('intake', 'action') } catch (err) {
    caught = true
    assert.ok(err instanceof PhaseAdvancementError, 'should throw PhaseAdvancementError')
    assert.strictEqual((err as PhaseAdvancementError).actualPhase, 'intake')
    assert.strictEqual((err as PhaseAdvancementError).expectedPhase, 'action')
  }
  assert.ok(caught, 'assertPhaseIs should have thrown')
}

{
  let caught = false
  try { assertPhaseIs(null, 'action') } catch (err) {
    caught = true
    assert.ok(err instanceof PhaseAdvancementError)
  }
  assert.ok(caught, 'assertPhaseIs(null) should have thrown')
}

console.log('✅ assertPhaseIs: all tests passed')

// ─── assertRegulationIs ───────────────────────────────────────────────────

// does not throw when regulation matches
assertRegulationIs('neutral', 'neutral', 'action')

// throws PhaseAdvancementError when regulation does not match
{
  let caught = false
  try { assertRegulationIs('dissatisfied', 'neutral', 'action') } catch (err) {
    caught = true
    assert.ok(err instanceof PhaseAdvancementError)
  }
  assert.ok(caught, 'assertRegulationIs should have thrown')
}

console.log('✅ assertRegulationIs: all tests passed')

// ─── hasCompletedPhase ────────────────────────────────────────────────────

// dissatisfied has not completed any phase
assert.strictEqual(hasCompletedPhase('dissatisfied', 'intake'), false)
assert.strictEqual(hasCompletedPhase('dissatisfied', 'action'), false)
assert.strictEqual(hasCompletedPhase('dissatisfied', 'reflection'), false)

// neutral proves intake is complete
assert.strictEqual(hasCompletedPhase('neutral', 'intake'), true, 'neutral proves intake complete')

// neutral proves action is complete (action keeps neutral)
assert.strictEqual(hasCompletedPhase('neutral', 'action'), true, 'neutral proves action complete')

// neutral does NOT prove reflection is complete
assert.strictEqual(hasCompletedPhase('neutral', 'reflection'), false, 'neutral does not prove reflection complete')

// satisfied proves all phases complete
assert.strictEqual(hasCompletedPhase('satisfied', 'intake'), true)
assert.strictEqual(hasCompletedPhase('satisfied', 'action'), true)
assert.strictEqual(hasCompletedPhase('satisfied', 'reflection'), true)

console.log('✅ hasCompletedPhase: all tests passed')

// ─── describeArcProgress ──────────────────────────────────────────────────

{
  const desc = describeArcProgress(null, 'satisfied')
  assert.ok(desc.includes('Arc complete'), 'completed arc description')
  assert.ok(desc.includes('epiphany') || desc.includes('Epiphany'), 'mentions epiphany')
}

{
  const desc = describeArcProgress(null, 'dissatisfied')
  assert.ok(desc.includes('No active arc'), 'no active arc description')
}

{
  const desc = describeArcProgress('intake', 'dissatisfied')
  assert.ok(desc.includes('Intake'), 'describes intake')
  assert.ok(desc.includes('dissatisfied'), 'shows dissatisfied')
}

{
  const desc = describeArcProgress('action', 'neutral')
  assert.ok(desc.includes('Action'), 'describes action')
  assert.ok(desc.includes('neutral'), 'shows neutral')
}

{
  const desc = describeArcProgress('reflection', 'neutral')
  assert.ok(desc.includes('Reflection'), 'describes reflection')
}

console.log('✅ describeArcProgress: all tests passed')

// ─── computeArcTrajectory ─────────────────────────────────────────────────

{
  const trajectory = computeArcTrajectory()
  assert.deepStrictEqual(trajectory.intake, { from: 'dissatisfied', to: 'neutral' })
  assert.deepStrictEqual(trajectory.action, { from: 'neutral', to: 'neutral' })
  assert.deepStrictEqual(trajectory.reflection, { from: 'neutral', to: 'satisfied' })
}

console.log('✅ computeArcTrajectory: all tests passed')

// ─── PhaseAdvancementError ────────────────────────────────────────────────

{
  const err = new PhaseAdvancementError('test message', 'intake', 'action')
  assert.strictEqual(err.name, 'PhaseAdvancementError')
  assert.strictEqual(err.message, 'test message')
  assert.strictEqual(err.actualPhase, 'intake')
  assert.strictEqual(err.expectedPhase, 'action')
  assert.ok(err instanceof Error, 'should be instanceof Error')
}

console.log('✅ PhaseAdvancementError: all tests passed')

// ─── Full arc simulation: dissatisfied → neutral → satisfied ──────────────

{
  let regulation: RegulationState = VERTICAL_SLICE.initialRegulation
  let phase: ArcPhase | null = 'intake'

  // ── Phase 1: Intake
  assert.strictEqual(regulation, 'dissatisfied', 'start: dissatisfied')
  assert.strictEqual(phase, 'intake')

  const intakeValidation = validateIntakePhaseCompletion(phase, regulation)
  assert.strictEqual(intakeValidation.valid, true, 'intake validation should pass')

  const intakeTransition = computeTransition(phase!, regulation)
  assert.strictEqual(intakeTransition.fromRegulation, 'dissatisfied')
  assert.strictEqual(intakeTransition.toRegulation, 'neutral')
  assert.strictEqual(intakeTransition.toPhase, 'action')
  assert.strictEqual(intakeTransition.arcComplete, false)

  regulation = intakeTransition.toRegulation
  phase = intakeTransition.toPhase

  // ── Phase 2: Action
  assert.strictEqual(regulation, 'neutral', 'after intake: neutral')
  assert.strictEqual(phase, 'action')

  const actionValidation = validateActionPhaseCompletion(phase, regulation)
  assert.strictEqual(actionValidation.valid, true, 'action validation should pass')

  const actionTransition = computeTransition(phase!, regulation)
  assert.strictEqual(actionTransition.fromRegulation, 'neutral')
  assert.strictEqual(actionTransition.toRegulation, 'neutral', 'action keeps neutral')
  assert.strictEqual(actionTransition.toPhase, 'reflection')
  assert.strictEqual(actionTransition.arcComplete, false)

  regulation = actionTransition.toRegulation
  phase = actionTransition.toPhase

  // ── Phase 3: Reflection
  assert.strictEqual(regulation, 'neutral', 'after action: still neutral')
  assert.strictEqual(phase, 'reflection')

  const reflectionValidation = validateReflectionPhaseCompletion(phase, regulation)
  assert.strictEqual(reflectionValidation.valid, true, 'reflection validation should pass')

  const reflectionTransition = computeTransition(phase!, regulation)
  assert.strictEqual(reflectionTransition.fromRegulation, 'neutral')
  assert.strictEqual(reflectionTransition.toRegulation, 'satisfied', 'reflection → satisfied = epiphany')
  assert.strictEqual(reflectionTransition.toPhase, null, 'arc complete')
  assert.strictEqual(reflectionTransition.arcComplete, true)

  regulation = reflectionTransition.toRegulation
  phase = reflectionTransition.toPhase

  // ── Arc Complete
  assert.strictEqual(regulation, 'satisfied', 'end: satisfied')
  assert.strictEqual(phase, null, 'end: no active phase')
}

console.log('✅ Full arc simulation: all tests passed')

// ─── Phase skipping prevention ────────────────────────────────────────────

// Cannot jump from dissatisfied directly to action phase
assert.strictEqual(validateActionPhaseCompletion('action', 'dissatisfied').valid, false,
  'cannot complete action from dissatisfied')

// Cannot jump from dissatisfied directly to reflection
assert.strictEqual(validateReflectionPhaseCompletion('reflection', 'dissatisfied').valid, false,
  'cannot complete reflection from dissatisfied')

// Cannot do reflection from satisfied (already done)
assert.strictEqual(validateReflectionPhaseCompletion('reflection', 'satisfied').valid, false,
  'cannot redo reflection when satisfied')

// Cannot redo intake after reaching neutral
assert.strictEqual(validateIntakePhaseCompletion('intake', 'neutral').valid, false,
  'cannot redo intake when neutral')

console.log('✅ Phase skipping prevention: all tests passed')

// ─── Consistency: computeTransition matches canAdvancePhase ───────────────

{
  const validCombinations: [ArcPhase, RegulationState][] = [
    ['intake', 'dissatisfied'],
    ['action', 'neutral'],
    ['reflection', 'neutral'],
  ]

  for (const [phase, regulation] of validCombinations) {
    assert.strictEqual(canAdvancePhase(phase, regulation), true,
      `canAdvancePhase(${phase}, ${regulation}) should be true`)
    // computeTransition should NOT throw
    computeTransition(phase, regulation)
  }

  const invalidCombinations: [ArcPhase, RegulationState][] = [
    ['intake', 'neutral'],
    ['intake', 'satisfied'],
    ['action', 'dissatisfied'],
    ['action', 'satisfied'],
    ['reflection', 'dissatisfied'],
    ['reflection', 'satisfied'],
  ]

  for (const [phase, regulation] of invalidCombinations) {
    assert.strictEqual(canAdvancePhase(phase, regulation), false,
      `canAdvancePhase(${phase}, ${regulation}) should be false`)
    assert.throws(
      () => computeTransition(phase, regulation),
      /invalid state/i,
      `computeTransition(${phase}, ${regulation}) should throw`,
    )
  }
}

console.log('✅ Consistency checks: all tests passed')

// ─── Action phase is the gatekeeper ───────────────────────────────────────

// The Action phase requires neutral regulation.
// This proves that the dissatisfied→neutral transition (Intake) has occurred.
{
  const blocked = validateActionPhaseCompletion('action', 'dissatisfied')
  assert.strictEqual(blocked.valid, false, 'action blocked without prior intake')
  assert.ok(blocked.reason?.includes("requires regulation 'neutral'"))

  const allowed = validateActionPhaseCompletion('action', 'neutral')
  assert.strictEqual(allowed.valid, true, 'action allowed with neutral (proves intake done)')
}

console.log('✅ Action phase gatekeeper: all tests passed')

// ─── Summary ──────────────────────────────────────────────────────────────

console.log('')
console.log('═══════════════════════════════════════════════════════════')
console.log('✅ All phase-advancement tests passed')
console.log('  - Phase-locked validation (all 3 phases)')
console.log('  - Action phase completion validation')
console.log('  - Transition computation (all 3 phase transitions)')
console.log('  - Phase assertion guards')
console.log('  - Regulation-from-phase inference (hasCompletedPhase)')
console.log('  - Full arc simulation (dissatisfied → neutral → satisfied)')
console.log('  - Phase skipping prevention')
console.log('  - Consistency with canAdvancePhase')
console.log('  - PhaseAdvancementError type')
console.log('═══════════════════════════════════════════════════════════')
