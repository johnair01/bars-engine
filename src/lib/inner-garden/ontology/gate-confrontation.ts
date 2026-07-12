/**
 * Inner Garden — Gate Confrontation (the quest mechanic).
 *
 * The core gamified loop (from the Technique Library spec, `clean-up-technique-system`,
 * Q3 "gate confrontation is the core learning path"; Q4 "reveals itself in the moment of
 * need"; Q2 "progressive unlock slots"):
 *
 *   blocker (carries a required capacity)
 *     → own the capacity?  yes → a TASK  (Clean Up)
 *                          no  → a QUEST (gate confrontation; Grow Up mints it)
 *                                 → complete by DEMONSTRATING the technique + Integration Check
 *                                 → earn the technique into a slot
 *                                 → the whole CLASS of that blocker is now a Task
 *
 * A quest is NOT a narrative arc (the Epiphany beats are only a story wrapper). A quest is
 * a capacity gate: it exists because you lacked a technique, and its reward is that
 * technique. Grow Up is the move of gate confrontation.
 *
 * DECISION (user, 2026-07-12): the required capacity is DERIVED FROM THE BLOCKER'S
 * SIGNATURE — the vector-edge it is stuck on — so gates are legible puzzles, not arbitrary.
 * The role vocabulary (metabolize/translate/transcend) mirrors
 * `emotional-alchemy` `MoveRole` and the `VECTOR_MOVE_FAMILIES` grid.
 *
 * Pure data + functions. No I/O, no render — tsx-testable.
 * Design doc: docs/handoffs/2026-07-12-inner-garden-progression-fractal.md (§quest layer)
 */
import type { ElementKey } from './domain-recipe'
import type { AllyshipDomain } from '@/lib/kotter'

export type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'

/** The metabolic role an edge demands — mirrors `MoveRole` (emotional-alchemy). */
export type MoveRole = 'metabolize' | 'translate' | 'transcend'

/** A blocker = one vector-edge a charge is stuck on (present → desired). */
export interface BlockerSignature {
  fromElement: ElementKey
  fromAltitude: Altitude
  toElement: ElementKey
  toAltitude: Altitude
  /** The WHERE — carried for framing; does not change the required capacity. */
  domain: AllyshipDomain
}

/**
 * A capacity (= technique = card) is identified by the edge it metabolizes:
 *   metabolize:<element>        dissatisfied → neutral, within a channel
 *   transcend:<element>         neutral → satisfied, within a channel
 *   translate:<from>-><to>      neutral → neutral, across channels
 * This is exactly the axis of `VECTOR_MOVE_FAMILIES` (5 metabolize + 5 transcend + 20 translate).
 */
export type CapacityKey = string

export function requiredRole(sig: BlockerSignature): MoveRole {
  if (sig.fromElement !== sig.toElement) return 'translate'
  if (sig.fromAltitude === 'dissatisfied') return 'metabolize'
  return 'transcend' // neutral → satisfied within a channel
}

/** Derive the single capacity a blocker demands — the "key" to the gate. */
export function deriveRequiredCapacity(sig: BlockerSignature): CapacityKey {
  const role = requiredRole(sig)
  if (role === 'translate') return `translate:${sig.fromElement}->${sig.toElement}`
  return `${role}:${sig.fromElement}`
}

// --- resolution: Task vs Quest ---

export interface TaskResolution {
  kind: 'task'
  capacity: CapacityKey
  move: 'clean_up'
}

/**
 * A well-formed quest (the "good quest" contract). Every field is required; a quest
 * missing any of these is content, not a quest.
 */
export interface QuestResolution {
  kind: 'quest'
  /** TRIGGER — the gate you could not pass. */
  trigger: BlockerSignature
  /** TARGET — the capacity this quest will grant (the missing key). */
  targetCapacity: CapacityKey
  /** The move that mints the quest — gate confrontation is a Grow Up. */
  mintedBy: 'grow_up'
  /** WIN-CONDITION — you cannot read your way to a card. */
  winCondition: 'demonstrate_then_integration_check'
  /** REWARD — the technique-card earned into a slot on completion. */
  reward: { capacity: CapacityKey; permanent: true }
  /** RETURN — the gate this unblocks (consequence in the world). */
  returnsTo: BlockerSignature
}

export type BlockerResolution = TaskResolution | QuestResolution

/**
 * Resolve a blocker against the player's owned capacities.
 * Own the key → a Task (Clean Up). Missing → gate confrontation → a Quest (Grow Up).
 */
export function resolveBlocker(
  sig: BlockerSignature,
  ownedCapacities: ReadonlySet<CapacityKey>,
): BlockerResolution {
  const required = deriveRequiredCapacity(sig)
  if (ownedCapacities.has(required)) {
    return { kind: 'task', capacity: required, move: 'clean_up' }
  }
  return {
    kind: 'quest',
    trigger: sig,
    targetCapacity: required,
    mintedBy: 'grow_up',
    winCondition: 'demonstrate_then_integration_check',
    reward: { capacity: required, permanent: true },
    returnsTo: sig,
  }
}

/** Complete a quest → the capacity enters the player's permanent slots. */
export function earnCapacity(
  owned: ReadonlySet<CapacityKey>,
  capacity: CapacityKey,
): Set<CapacityKey> {
  return new Set(owned).add(capacity)
}
