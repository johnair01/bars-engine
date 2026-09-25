/**
 * Emotional Alchemy Tool Registry — contract types.
 * Spec: .specify/specs/emotional-alchemy-tool-registry/spec.md § API Contracts
 *
 * Canon sources (this module transcribes, never invents):
 *   - docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md (v1.1) — tools T01–T11, compact matrices
 *   - docs/MTGOA_PRACTICE_ATLAS.md (v3) — §4 hard guards, §4.1 shape map,
 *     §5.2 Show Up templates, §5.3 spirit steps, §5.4 operational checks
 *
 * The registry declares; the composer (Atlas §10 target 3) enforces.
 */

import type { BasicMove, Channel } from '@/lib/allyship-deck/types'

/** Taxonomy rating key: strong = native protocol, medium = adaptable, weak = supports reflection only. */
export type ToolRating = 'strong' | 'medium' | 'weak' | 'not_recommended'

/**
 * Descriptive role annotation (Atlas §1.2 rolePath) — logged after tool choice,
 * never a selector. Matrix 2 ratings are a rank tiebreak only.
 */
export type MoveRole = 'metabolize' | 'translate' | 'transcend'

/** Emotion-named channels (taxonomy naming). Bridge to element channels via EMOTION_TO_ELEMENT. */
export type EmotionChannel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'

export type SatisfactionSpirit = 'peace' | 'triumph' | 'poignance' | 'bliss' | 'wonder'

/** WAVE phase (Atlas "submove"). Reuses the deck grammar's BasicMove. */
export type WaveLens = BasicMove

/**
 * Blocker shape (Atlas §4.1) — situational classification biasing tool rank.
 * Computed-and-confirmed in the diagnostic UI, never silent.
 */
export type BlockerShape =
  | 'interpersonal_live'
  | 'imagined_other'
  | 'two_voices'
  | 'belief_sentence'
  | 'many_items'
  | 'win_wont_land'
  | 'practice_edge'
  | 'unclear_heavy_body'
  | 'ready_to_act'

/** Atlas §4 hard guards — enforced by the composer as blocks, not footnotes. */
export type HardGuardId =
  | 'hot_charge'
  | 'joy_tool_block'
  | 'grief_inquiry_block'
  | 'no_gamified_risk'
  | 'action_on_grief_block'
  | 'clean_line_readiness'
  | 'external_gate'

export interface HardGuard {
  id: HardGuardId
  /** The rule as the composer must enforce it. */
  rule: string
}

export interface ToolProtocolTemplate {
  /** Full protocol, one imperative step per entry (taxonomy item 9). */
  steps: string[]
  /** Optional compressed variant (e.g. T01 "mini version 3 minutes"). */
  miniSteps?: string[]
}

export interface ToolTimebox {
  minMinutes: number
  maxMinutes: number
  /** Quick/mini variant duration where the taxonomy declares one. */
  quickMinutes?: number
}

/**
 * Deterministic Show Up templates (Atlas §5.2). Slots use `[slot]` syntax and
 * must resolve to the tool's outputFields or the player-supplied slots
 * (`recipient`, `date`, `time`) or a documented tool-local player input.
 */
export interface ShowUpTemplates {
  internal: string
  external: string
}

export interface OperationalCheck {
  /** The fuzzy criterion being made checkable. */
  criterion: string
  /** The check as rendered in-protocol (Atlas §5.4). */
  check: string
}

export interface PreferAnotherTool {
  condition: string
  toolId: string
}

/** Reconciliation pointers into the existing registries (Practice Atlas gap G4). */
export interface ToolMappings {
  /** Ids in CANONICAL_TECHNIQUES (src/lib/technique-library/canonical.ts). */
  techniqueIds: string[]
  /** Keys in DEFAULT_FIRST_AID_TOOLS (src/lib/emotional-first-aid.ts). */
  firstAidKeys: string[]
  note?: string
}

/**
 * One Emotional Alchemy tool — taxonomy items 1–18 plus the Atlas v3 composer
 * fields (hard guards, shape bonus keys, Show Up templates, operational checks).
 */
export interface EmotionalAlchemyTool {
  /** Stable id: 'T01'…'T11'. */
  id: string
  slug: string
  genericName: string
  barsName: string
  /** Taxonomy item 3 — source lineage / inspiration. */
  lineage: string
  /** Taxonomy item 4. */
  coreMechanic: string

  // ── ratings (taxonomy compact matrices 1–3; drift-tested) ──
  waveRatings: Record<WaveLens, ToolRating>
  moveRoleRatings: Record<MoveRole, ToolRating>
  channelRatings: Record<EmotionChannel, ToolRating>

  /** Taxonomy item 8 — signature misuse / collapse condition. */
  misuse: string
  protocol: ToolProtocolTemplate
  timebox: ToolTimebox

  // ── output (taxonomy items 11–12; compact matrix 4) ──
  /** Short slug naming the BAR-loggable output bundle. */
  outputKind: string
  /** Structured fields the session log persists (Atlas §1.6 privacy model). */
  outputFields: string[]
  /** Taxonomy item 12 — fill-in BAR reflection line. */
  barReflection: string

  // ── completion + safety (taxonomy items 13–15) ──
  completionCriteria: string[]
  whenNotToUse: string[]
  preferAnotherToolWhen: PreferAnotherTool[]

  /** Taxonomy item 18 — per-spirit prose notes (authoring guidance; not rendered until playtested, Atlas G9). */
  spiritNotes: Record<SatisfactionSpirit, string>

  // ── composer fields (Atlas v3) ──
  showUpTemplates: ShowUpTemplates
  hardGuardIds: HardGuardId[]
  shapeBonusKeys: BlockerShape[]
  operationalChecks: OperationalCheck[]

  mappings: ToolMappings
}

/** Re-exported for the emotion→element bridge (EMOTION_TO_ELEMENT). */
export type ElementChannel = Channel
