/**
 * Inner Garden — Move Crafting (per-thread; grow the library at the speed of need).
 *
 * Spec: .specify/specs/inner-garden-blocker-route-hand/spec.md
 *
 * When a thread's required capacity has no card yet, forge one. A grammatical move is MOSTLY
 * DERIVED from the thread; the human (with a full AI draft they ratify) authors only
 * `baseAct` + `name`. Everything else — role, channel, target spirit, wave move, fruit,
 * evidence kinds, the altitude-preserving capacity key — is stamped from the thread, so a
 * crafted move is GRAMMATICAL BY CONSTRUCTION.
 *
 * Blocker-clearing techniques are Clean Up moves (fruit = insight). Promotion is earned, not
 * asserted (Technique Library Q2). Pure functions; the AI draft is a typed seam (`MoveDraft`).
 */
import { MOVE_FRUIT, type BasicMove, type OutputBar } from './domain-recipe'
import {
  threadRouteHand,
  type CapacityKey,
  type ChannelThread,
  type EmotionChannel,
  type GatePath,
  type MoveRole,
  type SatisfactionSpirit,
} from './gate-confrontation'
import { ROLE_EVIDENCE, type EvidenceKind } from './demonstration'

export type MoveTier = 'candidate' | 'demonstrated' | 'adopted' | 'canonical'
export type CraftedBy = 'player' | 'ai_ratified' | 'canonical'

/** The derived, grammatical skeleton — stamped from the thread, never authored. */
export interface CraftSkeleton {
  capacityKey: CapacityKey
  waveMove: BasicMove // 'clean_up' — crafting is triggered by a blocker
  // ARTIFACT TYPE (OutputBar) the move produces — fixed by wave move. This is the move's
  // durable artifact banked to the Vault, NOT the plant's fruit (which is the allyshipDomain).
  fruit: OutputBar
  role: MoveRole
  channel: EmotionChannel
  target: SatisfactionSpirit
  evidenceKinds: EvidenceKind[] // fixed by role
}

/** The authored part — what the human ratifies from the AI's full draft. */
export interface MoveDraft {
  baseAct: string
  name: string
}

export interface GrammaticalMove extends CraftSkeleton, MoveDraft {
  craftedBy: CraftedBy
  tier: MoveTier
  provenance: { sourceThreadChannel: EmotionChannel; note?: string }
}

/** The capacity a thread most needs a card for: its first required step, else the optional depth. */
export function threadPrimaryCapacity(thread: ChannelThread): CapacityKey {
  const { required, optional } = threadRouteHand(thread)
  return required[0] ?? optional[0]!
}

/** Stamp the grammatical skeleton from a thread (all derived; nothing authored). */
export function buildCraftSkeleton(thread: ChannelThread): CraftSkeleton {
  const capacityKey = threadPrimaryCapacity(thread)
  const role = capacityKey.split(':')[0] as MoveRole
  const waveMove: BasicMove = 'clean_up'
  return {
    capacityKey,
    waveMove,
    fruit: MOVE_FRUIT[waveMove], // artifact type (OutputBar) for the move — not the plant's fruit(domain)
    role,
    channel: thread.channel,
    target: thread.target,
    evidenceKinds: ROLE_EVIDENCE[role],
  }
}

/** GatePath ('task' | 'school' | 'craft') is defined in gate-confrontation and imported above. */

/** Own the key → Task; a card exists in the library → School; nothing → Craft. Dedup by key. */
export function resolveGatePath(
  capacityKey: CapacityKey,
  ownedCapacities: ReadonlySet<CapacityKey>,
  libraryKeys: ReadonlySet<CapacityKey>,
): GatePath {
  if (ownedCapacities.has(capacityKey)) return 'task'
  if (libraryKeys.has(capacityKey)) return 'school'
  return 'craft'
}

export interface CraftValidation {
  valid: boolean
  reasons: string[]
}

/** Structural grammar check — a move that fails is not admitted to the library. */
export function validateGrammaticalMove(move: GrammaticalMove, thread: ChannelThread): CraftValidation {
  const reasons: string[] = []
  const sk = buildCraftSkeleton(thread)

  if (move.capacityKey !== sk.capacityKey) reasons.push('capacityKey does not match the thread')
  if (move.role !== sk.role) reasons.push('role does not match the thread step')
  if (move.channel !== sk.channel) reasons.push('channel does not match the thread')
  if (move.target !== sk.target) reasons.push('target spirit does not match the thread')
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

/** Forge a move for a thread from a ratified draft. Grammatical by construction; enters as a candidate. */
export function craftMove(
  thread: ChannelThread,
  draft: MoveDraft,
  craftedBy: CraftedBy = 'ai_ratified',
  note?: string,
): CraftResult {
  const skeleton = buildCraftSkeleton(thread)
  const move: GrammaticalMove = {
    ...skeleton,
    baseAct: draft.baseAct,
    name: draft.name,
    craftedBy,
    tier: 'candidate',
    provenance: { sourceThreadChannel: thread.channel, note },
  }
  return { move, validation: validateGrammaticalMove(move, thread) }
}

/** Signals that promote a candidate — earned, not asserted (Technique Library Q2). */
export interface PromotionSignals {
  demonstratedReuse: number
  adoptions: number
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
