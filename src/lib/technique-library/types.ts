/**
 * Allyship Technique Library — the Technique entity + supporting types.
 * Spec: .specify/specs/allyship-technique-vocabulary/spec.md § API Contracts
 *
 * A Technique is a do-able practice (book tool, imported wisdom-tradition
 * practice, or player-authored move) that declares which regions of the deck
 * grammar it serves via tag arrays. Linking to cards is EMERGENT (tag overlap),
 * not a foreign key — see resolve.ts.
 */

import type {
  BasicMove,
  Operation,
  AllyshipDomain,
  Channel,
  Capability,
  MoveAspect,
  Superpower,
} from './vocabulary'

export type TechniqueTier = 'canonical' | 'community' | 'personal'

/** Aspect a technique applies to. `both` = inner and outer. */
export type TechniqueAspect = MoveAspect | 'both'

export type TechniqueOrigin = 'book' | 'tradition' | 'personal_dev' | 'player' | 'gm' | 'ai'

/** Provenance of a metabolized technique. */
export interface TechniqueSource {
  origin: TechniqueOrigin
  /** Title of the book / tradition / school, e.g. "Mastering the Game of Allyship". */
  name?: string
  author?: string
  /** Tradition / school / who to honor (required for `tradition`/`personal_dev`). */
  lineage?: string
  /** License or consent note (required for `tradition`/`personal_dev`). */
  permission?: string
}

export interface Technique {
  id: string
  slug: string
  name: string
  /** One line: what it does. */
  essence: string
  /** The do-able practice (maps to clean-up-technique-system Technique.steps JSON). */
  steps: string[]

  // ── metabolization (provenance + footing) ──
  source: TechniqueSource
  /** The Integral footing — how an external practice lands in allyship context. */
  allyshipReframe?: string
  /** Why it serves development; lineage honored. Required for tradition/personal_dev imports. */
  ontologicalFooting?: string

  // ── shared link vocabulary (empty array = "applies to all" / wildcard) ──
  moves: BasicMove[]
  operations: Operation[]
  domains: AllyshipDomain[]
  /** Element keys; [] = channel-agnostic. */
  channels: Channel[]
  aspect: TechniqueAspect
  /** [] = available to any loadout; includes 'alchemist' = universal substrate. */
  superpowers: Superpower[]
  capabilities?: Capability[]

  // ── quality / safety ──
  optimizesFor?: string
  failureModes?: string[]
  contraindications?: string[]

  // ── authored anatomy (the skill-stack; optional, lifts a card toward L2–L4) ──
  /** Introspective reading (inner aspect) — "what am I feeling/avoiding?" */
  primaryQuestion?: string
  /** For-others / milestone reading (outer aspect) — "what does this campaign need?" */
  campaignQuestion?: string
  /** Anti-patterns — what NOT to do. */
  forbiddenMoves?: string[]
  /** A small recovery when the move fails. */
  remediation?: string
  /** Working-vs-performed test: how to tell real use from performance. */
  tell?: { working: string; performed: string }
  /** A concrete enactment (e.g. campaign-anchored). */
  example?: string
  /** Last assessed quality level (cache; assessQuality is the source of truth). */
  qualityLevel?: 0 | 1 | 2 | 3 | 4

  // ── lifecycle / ownership (living library) ──
  tier: TechniqueTier
  status: 'draft' | 'candidate' | 'published'
  ownerPlayerId?: string
  /** Hand-authored exceptions (rare); empty = pure emergent linking. */
  pinnedCardIds?: string[]
}

/** A technique resolved onto a card, with why it matched. */
export interface ResolvedTechnique {
  technique: Technique
  /** Specificity score — higher = more specific match. */
  score: number
  /** Which lens surfaced it: the active slot, or the universal Alchemy substrate. */
  viaSlot: MoveAspect | 'substrate'
}
