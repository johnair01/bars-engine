/**
 * Dojo entry, practice seeds, BAR links and Thought String orientation.
 * Spec: .specify/specs/dojo-entry-practice-seeds/spec.md
 */

export type Element = 'metal' | 'water' | 'wood' | 'fire' | 'earth'
export const ELEMENTS: readonly Element[] = ['metal', 'water', 'wood', 'fire', 'earth']

export type PracticeContext =
  | { kind: 'tutorial' }
  | { kind: 'seed'; seedId: string }
  | { kind: 'incipient_bar'; draftId: string }
  | { kind: 'bar'; barId: string }

/** A word is one shared object: every triangle that holds it reads the same charge. */
export type Word = { id: string; label: string; charge: number }

export type Triangle = {
  id: string
  /** Exactly three word ids. */
  wordIds: [string, string, string]
  /** Set when this triangle grew from another one through a shared word. */
  parentTriangleId?: string
  anchorWordId?: string
  /** Wall position in percent. Assigned once at creation, never inferred afterwards. */
  x: number
  y: number
}

export type ChargeHistoryEntry = {
  id: string
  kind: 'charge_shift' | 'eighth_ray'
  wordId: string
  from: number
  to: number
  at: string
  undone?: boolean
}

export type Bridge = {
  id: string
  chargedTriangleId: string
  positiveTriangleId: string
  text: string
  createdAt: string
}

export type Constellation = {
  id: string
  words: Word[]
  triangles: Triangle[]
  bridges: Bridge[]
  history: ChargeHistoryEntry[]
}

export type PracticeState = {
  constellation: Constellation
  /** One triangle at a time stands on the dojo floor. */
  projectedTriangleId: string | null
}

export type PracticeSeedStatus = 'active' | 'settled' | 'discarded' | 'planted'

export type PracticeSeed = {
  id: string
  ownerId: string
  title?: string
  intention?: string
  constellationId: string
  status: PracticeSeedStatus
  createdAt: string
  updatedAt: string
}

export type OutcomeKind = 'next_move' | 'positive_continuation' | 'bridge' | 'charge_shift'
export const OUTCOME_KINDS: readonly OutcomeKind[] = ['next_move', 'positive_continuation', 'bridge', 'charge_shift']

export type BarPracticeLink = {
  barId: string
  constellationId: string
  selectedOutcomes: Array<{ kind: OutcomeKind; summary: string; createdAt: string }>
}

export type ElementalEmber = {
  id: string
  sourceKind: 'practice_seed' | 'incipient_bar' | 'bar'
  sourceId: string
  element?: Element
  intensity: 1 | 2 | 3
  selectedIngredients: string[]
  status: 'held'
}

export const CHARGE_MIN = -3
export const CHARGE_MAX = 3
export const MAX_WORD_LENGTH = 40
export const MAX_TEXT_LENGTH = 280
