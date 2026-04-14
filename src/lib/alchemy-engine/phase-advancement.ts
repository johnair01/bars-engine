/**
 * Alchemy Engine — Phase-Locked State Advancement
 *
 * Central module for all phase transitions in the 3-phase CYOA arc.
 * Enforces the invariant: regulation advances ONLY on valid phase completion.
 *
 * Phase-lock rules:
 *   intake     → requires 'dissatisfied' → advances to 'neutral'  + phase='action'
 *   action     → requires 'neutral'      → stays    at 'neutral'  + phase='reflection'
 *   reflection → requires 'neutral'      → advances to 'satisfied' + arcComplete=true
 *
 * The Action phase completion specifically:
 *   - Validates player is in 'action' phase with 'neutral' regulation
 *   - Does NOT advance regulation (capacity building, not state change)
 *   - Moves phase to 'reflection'
 *   - This is the gate that ensures dissatisfied→neutral has already occurred
 *
 * Key invariant: Reflection BAR IS the epiphany (no separate Epiphany model).
 */

import type { PrismaClient } from '@prisma/client'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import {
  type ArcPhase,
  type RegulationState,
  type PhaseAdvanceResult,
  PHASE_REGULATION_MAP,
  ARC_PHASES,
  PHASE_INDEX,
  isArcPhase,
  nextPhase,
  canAdvancePhase,
  regulationAfterPhase,
} from './types'

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------

/** Detailed validation result for phase advancement prerequisites. */
export interface PhaseValidation {
  valid: boolean
  /** Current phase being validated. */
  currentPhase: ArcPhase | null
  /** Current regulation state. */
  currentRegulation: RegulationState
  /** Required regulation for the current phase. */
  requiredRegulation: RegulationState | null
  /** Human-readable explanation of why validation failed. */
  reason?: string
}

/** Snapshot of the state transition that occurred. */
export interface PhaseTransitionRecord {
  /** Phase before advancement. */
  fromPhase: ArcPhase
  /** Phase after advancement (null if arc complete). */
  toPhase: ArcPhase | null
  /** Regulation before advancement. */
  fromRegulation: RegulationState
  /** Regulation after advancement. */
  toRegulation: RegulationState
  /** Whether this transition completed the entire arc. */
  arcComplete: boolean
  /** Timestamp of the transition. */
  timestamp: Date
}

// ---------------------------------------------------------------------------
// Pure validation functions (no DB, no side effects)
// ---------------------------------------------------------------------------

/**
 * Validate whether a phase advancement is permitted.
 *
 * This is the core gate for phase-locked advancement.
 * Returns a detailed validation result explaining why advancement is or isn't permitted.
 */
export function validatePhaseAdvancement(
  currentPhase: ArcPhase | null,
  currentRegulation: RegulationState,
): PhaseValidation {
  // No active phase
  if (currentPhase === null || !isArcPhase(currentPhase)) {
    return {
      valid: false,
      currentPhase: null,
      currentRegulation,
      requiredRegulation: null,
      reason: 'No active arc phase. Start an arc first.',
    }
  }

  const required = PHASE_REGULATION_MAP[currentPhase]

  // Regulation doesn't match phase prerequisite (phase-locked)
  if (currentRegulation !== required.from) {
    return {
      valid: false,
      currentPhase,
      currentRegulation,
      requiredRegulation: required.from,
      reason: `Phase '${currentPhase}' requires regulation '${required.from}', but current regulation is '${currentRegulation}'. Phase-locked: cannot advance.`,
    }
  }

  return {
    valid: true,
    currentPhase,
    currentRegulation,
    requiredRegulation: required.from,
  }
}

/**
 * Compute the full transition record for a valid phase advancement.
 *
 * PRECONDITION: validatePhaseAdvancement must have returned valid=true.
 * Calling this with an invalid state throws an error.
 */
export function computeTransition(
  currentPhase: ArcPhase,
  currentRegulation: RegulationState,
): PhaseTransitionRecord {
  if (!canAdvancePhase(currentPhase, currentRegulation)) {
    throw new Error(
      `computeTransition called with invalid state: phase='${currentPhase}', regulation='${currentRegulation}'. Validate first.`,
    )
  }

  const toPhase = nextPhase(currentPhase)
  const toRegulation = regulationAfterPhase(currentPhase)

  return {
    fromPhase: currentPhase,
    toPhase,
    fromRegulation: currentRegulation,
    toRegulation,
    arcComplete: toPhase === null,
    timestamp: new Date(),
  }
}

/**
 * Validate that a specific phase transition is the one expected.
 *
 * Use this to guard against race conditions: confirm the phase we're completing
 * is the phase we think we're completing.
 */
export function assertPhaseIs(
  actual: ArcPhase | null,
  expected: ArcPhase,
): asserts actual is ArcPhase {
  if (actual !== expected) {
    throw new PhaseAdvancementError(
      `Expected phase '${expected}', but current phase is '${actual ?? 'none'}'.`,
      actual,
      expected,
    )
  }
}

/**
 * Validate that regulation is at the required level for a phase.
 */
export function assertRegulationIs(
  actual: RegulationState,
  expected: RegulationState,
  phase: ArcPhase,
): void {
  if (actual !== expected) {
    throw new PhaseAdvancementError(
      `Phase '${phase}' requires regulation '${expected}', but got '${actual}'. Phase-locked advancement prevents out-of-order transitions.`,
      phase,
      phase,
    )
  }
}

// ---------------------------------------------------------------------------
// Composite validators for specific phase completions
// ---------------------------------------------------------------------------

/**
 * Validate prerequisites for completing the Action phase.
 *
 * The Action phase is the critical gate that confirms:
 *   1. The Intake phase has already completed (dissatisfied → neutral happened)
 *   2. The player is in the 'action' phase
 *   3. Regulation is 'neutral' (the result of Intake completion)
 *
 * On valid Action completion:
 *   - Regulation stays 'neutral' (action builds capacity, doesn't change regulation)
 *   - Phase advances to 'reflection'
 */
export function validateActionPhaseCompletion(
  currentPhase: ArcPhase | null,
  currentRegulation: RegulationState,
): PhaseValidation {
  // First check phase
  if (currentPhase !== 'action') {
    return {
      valid: false,
      currentPhase: currentPhase,
      currentRegulation,
      requiredRegulation: 'neutral',
      reason: currentPhase === 'intake'
        ? 'Still in intake phase. Complete intake first to advance regulation from dissatisfied to neutral.'
        : currentPhase === 'reflection'
          ? 'Already past action phase. Currently in reflection.'
          : 'No active arc phase. Start an arc first.',
    }
  }

  // Then check regulation (must be neutral, proving intake was completed)
  return validatePhaseAdvancement(currentPhase, currentRegulation)
}

/**
 * Validate prerequisites for completing the Intake phase.
 *
 * Intake is the entry point: requires 'dissatisfied' regulation.
 * On completion: advances regulation to 'neutral', phase to 'action'.
 */
export function validateIntakePhaseCompletion(
  currentPhase: ArcPhase | null,
  currentRegulation: RegulationState,
): PhaseValidation {
  if (currentPhase !== 'intake') {
    return {
      valid: false,
      currentPhase,
      currentRegulation,
      requiredRegulation: 'dissatisfied',
      reason: currentPhase === null
        ? 'No active arc phase. Start an arc first.'
        : `Cannot complete intake: current phase is '${currentPhase}'.`,
    }
  }

  return validatePhaseAdvancement(currentPhase, currentRegulation)
}

/**
 * Validate prerequisites for completing the Reflection phase.
 *
 * Reflection requires 'neutral' regulation (same as action).
 * On completion: advances regulation to 'satisfied' (= epiphany), arc is complete.
 */
export function validateReflectionPhaseCompletion(
  currentPhase: ArcPhase | null,
  currentRegulation: RegulationState,
): PhaseValidation {
  if (currentPhase !== 'reflection') {
    return {
      valid: false,
      currentPhase,
      currentRegulation,
      requiredRegulation: 'neutral',
      reason: currentPhase === null
        ? 'No active arc phase. Start an arc first.'
        : `Cannot complete reflection: current phase is '${currentPhase}'.`,
    }
  }

  return validatePhaseAdvancement(currentPhase, currentRegulation)
}

// ---------------------------------------------------------------------------
// Transactional DB advancement (used within Prisma transactions)
// ---------------------------------------------------------------------------

/**
 * Advance the player's arc state within a Prisma transaction.
 *
 * This is the ONLY function that should write phase advancement to the DB.
 * It re-validates within the transaction to prevent race conditions.
 *
 * @param tx - Prisma transaction client
 * @param playerId - The player whose arc to advance
 * @param expectedPhase - The phase we expect to be completing (guard against races)
 * @returns The transition record describing what changed
 */
export async function advancePhaseInTransaction(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  playerId: string,
  expectedPhase: ArcPhase,
): Promise<PhaseTransitionRecord> {
  // Re-read state within the transaction for consistency
  const row = await (tx as any).alchemyPlayerState.findUnique({
    where: { playerId },
  })

  if (!row) {
    throw new PhaseAdvancementError(
      'AlchemyPlayerState not found within transaction.',
      null,
      expectedPhase,
    )
  }

  const currentPhase = row.arcPhase as ArcPhase | null
  const currentRegulation = row.altitude as RegulationState

  // Validate phase matches expectation (race condition guard)
  assertPhaseIs(currentPhase, expectedPhase)

  // Validate regulation prerequisite (phase-locked)
  const validation = validatePhaseAdvancement(currentPhase, currentRegulation)
  if (!validation.valid) {
    throw new PhaseAdvancementError(
      validation.reason ?? 'Phase advancement validation failed.',
      currentPhase,
      expectedPhase,
    )
  }

  // Compute the transition
  const transition = computeTransition(currentPhase, currentRegulation)

  // Write the advancement
  await (tx as any).alchemyPlayerState.update({
    where: { playerId },
    data: {
      altitude: transition.toRegulation,
      arcPhase: transition.toPhase,
      ...(transition.arcComplete ? { arcCompletedAt: transition.timestamp } : {}),
    },
  })

  return transition
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/** Error thrown when phase advancement is blocked by phase-lock rules. */
export class PhaseAdvancementError extends Error {
  constructor(
    message: string,
    public readonly actualPhase: ArcPhase | null,
    public readonly expectedPhase: ArcPhase | null,
  ) {
    super(message)
    this.name = 'PhaseAdvancementError'
  }
}

// ---------------------------------------------------------------------------
// Regulation trajectory helpers
// ---------------------------------------------------------------------------

/**
 * Compute the full regulation trajectory for a complete arc.
 * Useful for display in the reflection aggregator.
 */
export function computeArcTrajectory(): Record<ArcPhase, { from: RegulationState; to: RegulationState }> {
  return { ...PHASE_REGULATION_MAP }
}

/**
 * Determine if a regulation state proves that a given phase has been completed.
 *
 * Because regulation is monotonically non-decreasing within an arc:
 *   - 'neutral' proves intake is complete
 *   - 'satisfied' proves all phases are complete
 *   - 'dissatisfied' proves nothing has been completed
 */
export function hasCompletedPhase(
  regulation: RegulationState,
  phase: ArcPhase,
): boolean {
  const REGULATION_ORDER: Record<RegulationState, number> = {
    dissatisfied: 0,
    neutral: 1,
    satisfied: 2,
  }

  // The regulation after completing a phase
  const regulationAfter = regulationAfterPhase(phase)
  return REGULATION_ORDER[regulation] >= REGULATION_ORDER[regulationAfter]
}

/**
 * Get a human-readable description of the current arc progress.
 */
export function describeArcProgress(
  phase: ArcPhase | null,
  regulation: RegulationState,
): string {
  if (phase === null && regulation === 'satisfied') {
    return 'Arc complete. Epiphany achieved (satisfied).'
  }
  if (phase === null) {
    return 'No active arc.'
  }

  const phaseLabels: Record<ArcPhase, string> = {
    intake: 'Intake — naming what is stuck',
    action: 'Action — making a Challenger move',
    reflection: 'Reflection — synthesizing the epiphany',
  }

  const regulationLabels: Record<RegulationState, string> = {
    dissatisfied: 'dissatisfied (seeking clarity)',
    neutral: 'neutral (capacity built)',
    satisfied: 'satisfied (epiphany realized)',
  }

  return `Phase: ${phaseLabels[phase]}. Regulation: ${regulationLabels[regulation]}.`
}
