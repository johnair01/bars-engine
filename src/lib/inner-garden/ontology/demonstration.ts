/**
 * Inner Garden — The Demonstration Bar (why completing a quest grants real capacity).
 *
 * A quest's win-condition is `demonstrate_then_integration_check`. This module makes that
 * a MECHANISM, not a marker — the anti-hollowness gate. You cannot read your way to a card.
 *
 * Grounding:
 *  - charge-metabolism spec FR2 ("Recommendation Is Not Completion"): charge is metabolized
 *    only when the player creates an artifact, takes an action, completes an internal
 *    practice with a recorded trace, or reflects. → the four EvidenceKinds.
 *  - Technique Library (`clean-up-technique-system`): "earn more through … demonstrated
 *    use"; the Grow Up channel technique **Integration Check** — "did this actually
 *    metabolize?" → the verifier here.
 *
 * Two teeth:
 *  1. EVIDENCE OF THE RIGHT KIND — the kind is constrained by what the technique DOES
 *     (a transcend/outer-action technique can't be completed with a reflection; a
 *     metabolize/inner-discharge one needs a traced practice). This is the teeth.
 *  2. THE EDGE WAS CROSSED — pre-state must match the gate; post-state must reach the
 *     target. Falling short is "data, not failure" — no card yet.
 *
 * NOTE ON REGRESS: the Integration Check is itself a Grow Up technique, so it is assumed
 * FOUNDATIONAL (granted in the player's starting slot) — otherwise you'd need it to earn
 * it. See `INTEGRATION_CHECK_IS_FOUNDATIONAL`.
 *
 * Pure functions. No I/O, no render — tsx-testable.
 */
import type { ElementKey } from './domain-recipe'
import {
  earnCapacity,
  requiredRole,
  type Altitude,
  type CapacityKey,
  type MoveRole,
  type QuestResolution,
} from './gate-confrontation'

/** The Integration Check ships with every player (avoids the earn-it-to-earn-it regress). */
export const INTEGRATION_CHECK_IS_FOUNDATIONAL = true

/** The four ways charge is actually metabolized (charge-metabolism FR2). */
export type EvidenceKind = 'traced_practice' | 'reflection' | 'artifact' | 'action'

/**
 * Which evidence kinds legitimately demonstrate a technique of a given role. This is the
 * teeth: the KIND of proof is constrained by what the move does.
 *  - metabolize (dissatisfied→neutral): inner discharge → a recorded practice trace.
 *  - translate  (cross-channel bridge):  a reflection that names the bridge.
 *  - transcend  (neutral→satisfied):     investing capacity in the world → an artifact/action.
 */
export const ROLE_EVIDENCE: Record<MoveRole, EvidenceKind[]> = {
  metabolize: ['traced_practice'],
  translate: ['reflection'],
  transcend: ['artifact', 'action'],
}

export interface ChargeState {
  element: ElementKey
  altitude: Altitude
}

/** What the player brings to close the gate. */
export interface Demonstration {
  /** The technique they applied (should equal the quest's target). */
  techniqueApplied: CapacityKey
  evidenceKind: EvidenceKind
  /** The artifact / action record / practice trace / reflection text — must be non-empty. */
  evidenceRef: string
  /** Where the charge started — must match the gate being confronted. */
  preState: ChargeState
  /** Where the charge got to — must reach the gate's target for a pass. */
  postState: ChargeState
}

export interface IntegrationResult {
  passed: boolean
  /** Human-legible reasons a check failed (empty when passed). "Data, not failure." */
  reasons: string[]
}

const ALTITUDE_RANK: Record<Altitude, number> = { dissatisfied: 0, neutral: 1, satisfied: 2 }

/**
 * The Integration Check — "did this actually metabolize?". Verifies a demonstration
 * against the quest it claims to complete. Pure and deterministic.
 */
export function runIntegrationCheck(quest: QuestResolution, demo: Demonstration): IntegrationResult {
  const reasons: string[] = []
  const gate = quest.trigger
  const role = requiredRole(gate)

  // 0. Applied the technique this quest is actually about.
  if (demo.techniqueApplied !== quest.targetCapacity) {
    reasons.push(`applied "${demo.techniqueApplied}" but this gate needs "${quest.targetCapacity}"`)
  }

  // 1. Evidence exists.
  if (!demo.evidenceRef.trim()) {
    reasons.push('no evidence — a recommendation is not completion')
  }

  // 2. Evidence is of a KIND that can demonstrate this role (the teeth).
  if (!ROLE_EVIDENCE[role].includes(demo.evidenceKind)) {
    reasons.push(
      `a ${role} technique cannot be demonstrated by a ${demo.evidenceKind}; ` +
        `it needs ${ROLE_EVIDENCE[role].join(' or ')}`,
    )
  }

  // 3. Addressed THIS gate (pre-state matches the blocker's start).
  if (demo.preState.element !== gate.fromElement || demo.preState.altitude !== gate.fromAltitude) {
    reasons.push('the practice did not start from this gate’s state')
  }

  // 4. The edge was crossed (post-state reached the target).
  const reachedElement = demo.postState.element === gate.toElement
  const reachedAltitude = ALTITUDE_RANK[demo.postState.altitude] >= ALTITUDE_RANK[gate.toAltitude]
  if (!reachedElement || !reachedAltitude) {
    reasons.push(
      `moved to ${demo.postState.element}:${demo.postState.altitude} but the gate needs ` +
        `${gate.toElement}:${gate.toAltitude} — movement short of the edge is data, not failure`,
    )
  }

  return { passed: reasons.length === 0, reasons }
}

export interface QuestCompletion {
  granted: boolean
  result: IntegrationResult
  /** The player's slots after the attempt (unchanged unless granted). */
  owned: Set<CapacityKey>
}

/**
 * Attempt to complete a quest with a demonstration. Grants the technique-card into a
 * permanent slot ONLY if the Integration Check passes.
 */
export function completeQuest(
  quest: QuestResolution,
  demo: Demonstration,
  owned: ReadonlySet<CapacityKey>,
): QuestCompletion {
  const result = runIntegrationCheck(quest, demo)
  if (!result.passed) {
    return { granted: false, result, owned: new Set(owned) }
  }
  return { granted: true, result, owned: earnCapacity(owned, quest.reward.capacity) }
}
