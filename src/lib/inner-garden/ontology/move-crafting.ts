/**
 * Inner Garden — Move Crafting (growing the library at the speed of player need).
 *
 * When a gate's required capacity has NO card in the library yet, the key must be forged.
 * This is the third branch of gate resolution:
 *
 *   own the capacity        → Task   (Clean Up)
 *   card exists, not owned   → Quest via SCHOOL   (learn the existing card)
 *   no card exists at all    → Quest via CRAFT    (forge it — a Council session)
 *
 * THE KEY IDEA: a grammatical move is MOSTLY DERIVED from the gate. The human (with a
 * full AI draft they ratify — user decision 2026-07-12) authors only two things: the
 * `baseAct` (the imperative they actually do) and the `name`. Everything that makes it
 * well-formed — role, channels, wave move, fruit, required evidence, canonical key — is
 * stamped from the gate, so a crafted move is GRAMMATICAL BY CONSTRUCTION.
 *
 * Grounding:
 *  - move-library tiers (charge-metabolism spec §Move Library): the lowest tier is
 *    "player-named or daemon-generated candidate moves" — AI-drafted candidates are
 *    already a sanctioned tier.
 *  - Technique Library (`clean-up-technique-system`) Q5: techniques emerge from work, get
 *    named by the pair, stored with context; Q2: promotion is earned "through teaching and
 *    demonstrated use", not asserted.
 *  - grammar/schema authority: `deck-card-move-grammar` spec.
 *
 * Blocker-clearing techniques are Clean Up moves (fruit = insight); the metabolize/
 * translate/transcend ROLE distinguishes which edge within Clean Up they handle.
 *
 * Pure functions. The only non-pure step — the AI drafting `MoveDraft`s — is a typed seam
 * (`MoveDraft`), out of this module. No I/O, no render — tsx-testable.
 */
import { MOVE_FRUIT, type BasicMove, type ElementKey, type OutputBar } from './domain-recipe'
import {
  deriveRequiredCapacity,
  requiredRole,
  type BlockerSignature,
  type CapacityKey,
  type MoveRole,
} from './gate-confrontation'
import { ROLE_EVIDENCE, type EvidenceKind } from './demonstration'

export type MoveTier = 'candidate' | 'demonstrated' | 'adopted' | 'canonical'
export type CraftedBy = 'player' | 'ai_ratified' | 'canonical'

/** The derived, grammatical skeleton — stamped from the gate, never authored. */
export interface CraftSkeleton {
  capacityKey: CapacityKey
  waveMove: BasicMove // always 'clean_up' — crafting is triggered by a blocker
  fruit: OutputBar // fixed by wave move
  role: MoveRole
  sourceElement: ElementKey
  targetElement: ElementKey
  evidenceKinds: EvidenceKind[] // fixed by role
}

/** The authored part — what the human ratifies from the AI's full draft. */
export interface MoveDraft {
  baseAct: string // the imperative you actually do
  name: string // the memorable handle
}

export interface GrammaticalMove extends CraftSkeleton, MoveDraft {
  craftedBy: CraftedBy
  tier: MoveTier
  provenance: { sourceGateKey: CapacityKey; note?: string }
}

/** Stamp the grammatical skeleton from the gate (all derived; nothing authored). */
export function buildCraftSkeleton(gate: BlockerSignature): CraftSkeleton {
  const role = requiredRole(gate)
  const waveMove: BasicMove = 'clean_up'
  return {
    capacityKey: deriveRequiredCapacity(gate),
    waveMove,
    fruit: MOVE_FRUIT[waveMove],
    role,
    sourceElement: gate.fromElement,
    targetElement: gate.toElement,
    evidenceKinds: ROLE_EVIDENCE[role],
  }
}

export type GatePath = 'task' | 'school' | 'craft'

/**
 * Which path a gate takes. `libraryKeys` = every capacity that already has a card
 * (canonical + prior candidates) — this is the dedup that prevents re-forging.
 */
export function resolveGatePath(
  gate: BlockerSignature,
  ownedCapacities: ReadonlySet<CapacityKey>,
  libraryKeys: ReadonlySet<CapacityKey>,
): GatePath {
  const key = deriveRequiredCapacity(gate)
  if (ownedCapacities.has(key)) return 'task'
  if (libraryKeys.has(key)) return 'school'
  return 'craft'
}

export interface CraftValidation {
  valid: boolean
  reasons: string[]
}

/** Structural grammar check — a move that fails is not admitted to the library. */
export function validateGrammaticalMove(move: GrammaticalMove, gate: BlockerSignature): CraftValidation {
  const reasons: string[] = []
  const sk = buildCraftSkeleton(gate)

  if (move.capacityKey !== sk.capacityKey) reasons.push('capacityKey does not match the gate')
  if (move.role !== sk.role) reasons.push('role does not match the gate edge')
  if (move.sourceElement !== sk.sourceElement || move.targetElement !== sk.targetElement) {
    reasons.push('channels do not match the gate')
  }
  if (move.waveMove !== sk.waveMove) reasons.push('a blocker-clearing move must be a Clean Up')
  if (move.fruit !== sk.fruit) reasons.push('fruit must be fixed by the wave move')
  if (move.evidenceKinds.join(',') !== sk.evidenceKinds.join(',')) {
    reasons.push('evidence kinds must be fixed by the role')
  }
  if (!move.baseAct.trim()) reasons.push('baseAct is empty — a move must name an act')
  if (!move.name.trim()) reasons.push('name is empty — the pair must name it')

  return { valid: reasons.length === 0, reasons }
}

export interface CraftResult {
  move: GrammaticalMove
  validation: CraftValidation
}

/**
 * Forge a move for a gate from a ratified draft. Grammatical by construction (skeleton
 * derived); enters as a private `candidate`. Returns the move + its validation.
 */
export function craftMove(
  gate: BlockerSignature,
  draft: MoveDraft,
  craftedBy: CraftedBy = 'ai_ratified',
  note?: string,
): CraftResult {
  const skeleton = buildCraftSkeleton(gate)
  const move: GrammaticalMove = {
    ...skeleton,
    baseAct: draft.baseAct,
    name: draft.name,
    craftedBy,
    tier: 'candidate',
    provenance: { sourceGateKey: skeleton.capacityKey, note },
  }
  return { move, validation: validateGrammaticalMove(move, gate) }
}

/** Signals that promote a candidate — earned, not asserted (Technique Library Q2). */
export interface PromotionSignals {
  demonstratedReuse: number // gates crossed with this move
  adoptions: number // other players who earned it from you (teaching)
  gmReviewed: boolean
}

export const PROMOTION_THRESHOLDS = { demonstratedReuse: 3, adoptions: 1 } as const

/** Compute the tier a candidate has earned from its signals. Monotonic. */
export function promoteTier(signals: PromotionSignals): MoveTier {
  if (signals.gmReviewed && signals.adoptions >= PROMOTION_THRESHOLDS.adoptions) return 'canonical'
  if (signals.adoptions >= PROMOTION_THRESHOLDS.adoptions) return 'adopted'
  if (signals.demonstratedReuse >= PROMOTION_THRESHOLDS.demonstratedReuse) return 'demonstrated'
  return 'candidate'
}
