/**
 * Alchemy Engine — Intake Phase Logic Verification
 *
 * Pure logic tests for type guards, phase advancement rules, and regulation mapping.
 * No test framework needed — uses assertions.
 *
 * Run: npx tsx src/lib/alchemy-engine/__tests__/intake-logic.verify.ts
 */

import {
  ARC_PHASES,
  PHASE_REGULATION_MAP,
  VERTICAL_SLICE,
  isArcPhase,
  isRegulationState,
  nextPhase,
  canAdvancePhase,
  regulationAfterPhase,
  PHASE_BAR_CHANNEL_TYPE,
} from '../types'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`  PASS: ${message}`)
}

console.log('=== Alchemy Engine — Intake Phase Logic Verification ===\n')

// ---------------------------------------------------------------------------
// 1. Phase-locked regulation: intake completion → dissatisfied → neutral
// ---------------------------------------------------------------------------
console.log('1. Phase-locked regulation mapping')

assert(
  PHASE_REGULATION_MAP.intake.from === 'dissatisfied',
  'Intake phase requires dissatisfied regulation',
)

assert(
  PHASE_REGULATION_MAP.intake.to === 'neutral',
  'Intake completion advances to neutral regulation',
)

assert(
  regulationAfterPhase('intake') === 'neutral',
  'regulationAfterPhase("intake") returns "neutral"',
)

// ---------------------------------------------------------------------------
// 2. Phase advancement: intake → action
// ---------------------------------------------------------------------------
console.log('\n2. Phase advancement')

assert(
  nextPhase('intake') === 'action',
  'Next phase after intake is action',
)

assert(
  canAdvancePhase('intake', 'dissatisfied') === true,
  'Can advance from intake when regulation is dissatisfied',
)

assert(
  canAdvancePhase('intake', 'neutral') === false,
  'Cannot advance from intake when regulation is already neutral',
)

assert(
  canAdvancePhase('intake', 'satisfied') === false,
  'Cannot advance from intake when regulation is satisfied',
)

// ---------------------------------------------------------------------------
// 3. Vertical slice defaults
// ---------------------------------------------------------------------------
console.log('\n3. Vertical slice defaults')

assert(
  VERTICAL_SLICE.face === 'challenger',
  'Vertical slice face is challenger',
)

assert(
  VERTICAL_SLICE.waveMove === 'wakeUp',
  'Vertical slice wave move is wakeUp',
)

assert(
  VERTICAL_SLICE.initialRegulation === 'dissatisfied',
  'Vertical slice initial regulation is dissatisfied',
)

// ---------------------------------------------------------------------------
// 4. BAR channel typing
// ---------------------------------------------------------------------------
console.log('\n4. BAR channel typing')

assert(
  PHASE_BAR_CHANNEL_TYPE.intake === 'intake',
  'Intake BAR type is "intake"',
)

assert(
  PHASE_BAR_CHANNEL_TYPE.action === 'action',
  'Action BAR type is "action"',
)

assert(
  PHASE_BAR_CHANNEL_TYPE.reflection === 'reflection',
  'Reflection BAR type is "reflection"',
)

// ---------------------------------------------------------------------------
// 5. Type guards
// ---------------------------------------------------------------------------
console.log('\n5. Type guards')

assert(isArcPhase('intake'), '"intake" is a valid arc phase')
assert(isArcPhase('action'), '"action" is a valid arc phase')
assert(isArcPhase('reflection'), '"reflection" is a valid arc phase')
assert(!isArcPhase('invalid'), '"invalid" is not a valid arc phase')
assert(!isArcPhase(null), 'null is not a valid arc phase')

assert(isRegulationState('dissatisfied'), '"dissatisfied" is a valid regulation state')
assert(isRegulationState('neutral'), '"neutral" is a valid regulation state')
assert(isRegulationState('satisfied'), '"satisfied" is a valid regulation state')
assert(!isRegulationState('unknown'), '"unknown" is not a valid regulation state')

// ---------------------------------------------------------------------------
// 6. Full arc phase sequence
// ---------------------------------------------------------------------------
console.log('\n6. Full arc phase sequence')

assert(ARC_PHASES[0] === 'intake', 'Phase 0 is intake')
assert(ARC_PHASES[1] === 'action', 'Phase 1 is action')
assert(ARC_PHASES[2] === 'reflection', 'Phase 2 is reflection')
assert(ARC_PHASES.length === 3, 'Exactly 3 phases')

// Simulate the full intake → action transition
const intakeRegulation = PHASE_REGULATION_MAP.intake.from // 'dissatisfied'
assert(canAdvancePhase('intake', intakeRegulation), 'Intake is advanceable from dissatisfied')
const newRegulation = regulationAfterPhase('intake')
assert(newRegulation === 'neutral', 'After intake, regulation is neutral')
const newPhaseAfterIntake = nextPhase('intake')
assert(newPhaseAfterIntake === 'action', 'After intake, phase is action')

console.log('\n=== All intake phase logic checks passed! ===')
