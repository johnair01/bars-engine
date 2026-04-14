/**
 * Alchemy Engine — Template Bank Types
 *
 * GM-authored passage template bank for the 3-phase CYOA arc.
 * Templates are keyed by: face × WAVE move × phase, with channel-typed content slots.
 *
 * The template bank is the GM's authoring surface for CYOA content.
 * Each passage template defines the narrative text, choices, and channel metadata
 * for a single phase of an arc, scoped to a specific face + WAVE move combination.
 *
 * Vertical slice scope: Challenger face + Wake Up WAVE move only.
 * Non-AI path is first-class: all templates include static (non-AI) content paths.
 *
 * @see src/lib/alchemy-engine/types.ts — ArcPhase, RegulationState, VERTICAL_SLICE
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, PersonalMoveType, EmotionalChannel
 * @see src/lib/alchemy/types.ts — AlchemyAltitude, AlchemyChoice
 * @see src/lib/narrative-template/types.ts — Pattern reference for template config shapes
 */

import type { GameMasterFace, PersonalMoveType, EmotionalChannel } from '@/lib/quest-grammar/types'
import type { ArcPhase, RegulationState, ChallengerMoveId } from './types'

// ---------------------------------------------------------------------------
// Template Bank Key
// ---------------------------------------------------------------------------

/**
 * Composite key for looking up a passage template in the bank.
 * A unique template exists for each (face, waveMove, phase) triple.
 *
 * Vertical slice: face='challenger', waveMove='wakeUp'
 */
export interface TemplateBankKey {
  /** Which GM face this template belongs to. */
  face: GameMasterFace
  /** Which WAVE move this template is designed for. */
  waveMove: PersonalMoveType
  /** Which arc phase this template drives (intake | action | reflection). */
  phase: ArcPhase
}

/**
 * Serialized key for Map/Record lookups.
 * Format: `${face}::${waveMove}::${phase}`
 * Example: `challenger::wakeUp::intake`
 */
export type TemplateBankKeyString = `${GameMasterFace}::${PersonalMoveType}::${ArcPhase}`

/** Produce a serialized key from its components. */
export function toTemplateBankKey(key: TemplateBankKey): TemplateBankKeyString {
  return `${key.face}::${key.waveMove}::${key.phase}`
}

/** Parse a serialized key back to its components. Returns null if malformed. */
export function parseTemplateBankKey(keyStr: string): TemplateBankKey | null {
  const parts = keyStr.split('::')
  if (parts.length !== 3) return null
  const [face, waveMove, phase] = parts as [string, string, string]
  // Minimal validation — callers should use type guards from types.ts for full validation
  if (!face || !waveMove || !phase) return null
  return {
    face: face as GameMasterFace,
    waveMove: waveMove as PersonalMoveType,
    phase: phase as ArcPhase,
  }
}

// ---------------------------------------------------------------------------
// Channel-Typed Content Slot
// ---------------------------------------------------------------------------

/**
 * A content slot that varies by emotional channel.
 *
 * Each passage template can have channel-specific narrative variations.
 * The `default` content is used when no channel-specific override exists,
 * ensuring the non-AI path always has content to render.
 *
 * Example: An Intake passage about "What's bugging you?" might have:
 *   - default: generic dissatisfaction prompt
 *   - Fear: "What keeps you up at night?"
 *   - Anger: "What boundary keeps getting crossed?"
 *   - Sadness: "What loss are you carrying?"
 */
export interface ChannelContentSlot {
  /** Default content — always present. Non-AI path uses this. */
  default: string
  /** Optional channel-specific overrides. Title-case keys match EmotionalChannel. */
  channelOverrides?: Partial<Record<EmotionalChannel, string>>
}

/**
 * Resolve the best content for a given channel from a slot.
 * Falls back to default if no channel-specific override exists.
 */
export function resolveChannelContent(
  slot: ChannelContentSlot,
  channel: EmotionalChannel | null,
): string {
  if (channel && slot.channelOverrides?.[channel]) {
    return slot.channelOverrides[channel]!
  }
  return slot.default
}

// ---------------------------------------------------------------------------
// Passage Choice
// ---------------------------------------------------------------------------

/**
 * A single choice within a passage template.
 *
 * Choices drive CYOA branching AND encode alchemy meaning:
 * - `regulationEffect`: how this choice moves the player's regulation state
 * - `channelAffinity`: which emotional channel this choice resonates with
 * - `challengerMoveId`: (Action phase only) which Challenger move this maps to
 *
 * The `isGrowth` flag from AlchemyChoice is replaced by the richer
 * `regulationEffect` for phase-locked advancement.
 */
export interface PassageChoice {
  /** Unique key within this passage (e.g. 'confront', 'avoid', 'reframe'). */
  key: string
  /** Display label — what the player sees. */
  label: ChannelContentSlot
  /** Optional flavor text shown after selection. */
  consequence: ChannelContentSlot
  /**
   * How this choice affects regulation.
   * - 'advance': moves regulation toward the phase target (growth choice)
   * - 'sustain': keeps regulation at current level (neutral choice)
   * - 'regress': moves regulation backward (avoidance choice — still valid, not punished)
   */
  regulationEffect: 'advance' | 'sustain' | 'regress'
  /** Which emotional channel this choice resonates with, if any. */
  channelAffinity?: EmotionalChannel
  /**
   * Action phase only: which Challenger move this choice executes.
   * Must be a valid ChallengerMoveId ('issue_challenge' | 'propose_move').
   */
  challengerMoveId?: ChallengerMoveId
}

// ---------------------------------------------------------------------------
// Passage Template
// ---------------------------------------------------------------------------

/**
 * A single passage template — the unit of GM-authored CYOA content.
 *
 * Each passage template is a node in the 3-phase arc, containing:
 * - Narrative content (channel-typed for emotional specificity)
 * - Choices that drive phase progression
 * - Metadata linking it to the face/WAVE/phase coordinate system
 *
 * The GM authors these; the engine renders them as CYOA steps.
 */
export interface PassageTemplate {
  /** Unique identifier for this template. */
  id: string
  /** Human-readable title (for GM admin views). */
  title: string

  // --- Coordinate keys ---
  /** Which GM face this passage belongs to. */
  face: GameMasterFace
  /** Which WAVE move this passage is designed for. */
  waveMove: PersonalMoveType
  /** Which arc phase this passage belongs to. */
  phase: ArcPhase

  // --- Regulation context ---
  /**
   * Expected regulation state when this passage is entered.
   * Used for validation: player must be at this regulation to see this passage.
   * Maps from PHASE_REGULATION_MAP[phase].from
   */
  regulationFrom: RegulationState
  /**
   * Target regulation state after completing this passage.
   * Maps from PHASE_REGULATION_MAP[phase].to
   */
  regulationTo: RegulationState

  // --- Content slots (channel-typed) ---
  /** Opening narrative — sets the scene. */
  situation: ChannelContentSlot
  /** The friction point — what's at stake, what's uncomfortable. */
  friction: ChannelContentSlot
  /** The invitation — what the player is being asked to consider. */
  invitation: ChannelContentSlot

  // --- Choices ---
  /**
   * Available choices for this passage.
   * At least one choice should have regulationEffect='advance'.
   * The non-AI path always has static choices; AI can generate additional ones.
   */
  choices: PassageChoice[]

  // --- Optional fields ---
  /** GM advice/commentary — shown in admin views, not player-facing. */
  gmAdvice?: string
  /** Optional AI prompt hint — used when AI generates dynamic content variants. */
  aiPromptHint?: string
  /** Sort order within the phase (for multi-passage phases, future expansion). */
  sortOrder: number
  /** Template status. */
  status: 'active' | 'draft' | 'archived'
}

// ---------------------------------------------------------------------------
// Template Bank
// ---------------------------------------------------------------------------

/**
 * The complete template bank — a collection of passage templates
 * keyed by (face, waveMove, phase).
 *
 * The bank is the GM's authoring surface. The engine queries it
 * to find the right passage template for a player's current arc state.
 *
 * For the vertical slice, the bank contains exactly 3 templates:
 *   challenger::wakeUp::intake
 *   challenger::wakeUp::action
 *   challenger::wakeUp::reflection
 */
export interface TemplateBank {
  /** All passage templates, keyed by serialized TemplateBankKey. */
  templates: Map<TemplateBankKeyString, PassageTemplate>
  /** Bank metadata. */
  metadata: TemplateBankMetadata
}

/** Metadata about the template bank. */
export interface TemplateBankMetadata {
  /** Unique identifier for this bank version. */
  id: string
  /** Human-readable name (e.g. 'Challenger Wake Up Arc v1'). */
  name: string
  /** When this bank was last updated. */
  updatedAt: Date
  /** Which face+move combinations have complete 3-phase coverage. */
  completedArcs: TemplateBankKey[]
}

// ---------------------------------------------------------------------------
// Template Bank Query
// ---------------------------------------------------------------------------

/**
 * Query parameters for finding a passage template.
 * The engine uses this to look up what content to show the player.
 */
export interface TemplateBankQuery {
  /** Required: which face the arc is using. */
  face: GameMasterFace
  /** Required: which WAVE move the arc is using. */
  waveMove: PersonalMoveType
  /** Required: which phase the player is in. */
  phase: ArcPhase
  /** Optional: player's current channel (for channel-typed content resolution). */
  channel?: EmotionalChannel
}

/**
 * Result of a template bank lookup.
 */
export type TemplateBankLookupResult =
  | { found: true; template: PassageTemplate }
  | { found: false; key: TemplateBankKeyString; reason: string }

// ---------------------------------------------------------------------------
// Reflection BAR as Epiphany
// ---------------------------------------------------------------------------

/**
 * Reflection passage template extension.
 *
 * The Reflection phase passage is special: the BAR it produces IS the epiphany.
 * This type adds reflection-specific fields that shape the epiphany artifact.
 *
 * The reflection passage's choices don't advance regulation directly —
 * instead, they shape the language and framing of the epiphany BAR.
 */
export interface ReflectionPassageExtension {
  /**
   * Epiphany framing prompts — channel-typed questions that help the player
   * articulate their insight. These become the content of the Reflection BAR.
   *
   * Example: "What shifted for you?" / "What do you see differently now?"
   */
  epiphanyPrompt: ChannelContentSlot
  /**
   * Seed phrases for the epiphany title — the player picks or edits one.
   * These become the BAR title, making the Reflection BAR the epiphany artifact.
   */
  epiphanySeedPhrases: ChannelContentSlot
  /**
   * Whether to offer a freeform text input for the epiphany.
   * When true, the player can write their own epiphany text
   * instead of (or in addition to) choosing from static options.
   * Non-AI path: freeform is always available as an option.
   */
  allowFreeformEpiphany: boolean
}

/**
 * Full Reflection passage template — combines base PassageTemplate
 * with ReflectionPassageExtension.
 */
export type ReflectionPassageTemplate = PassageTemplate & ReflectionPassageExtension

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/** Check if a PassageTemplate is a ReflectionPassageTemplate. */
export function isReflectionPassage(
  template: PassageTemplate,
): template is ReflectionPassageTemplate {
  return (
    template.phase === 'reflection' &&
    'epiphanyPrompt' in template &&
    'epiphanySeedPhrases' in template
  )
}

/** Check if a template bank key string is well-formed. */
export function isValidTemplateBankKey(key: string): key is TemplateBankKeyString {
  return parseTemplateBankKey(key) !== null
}

// ---------------------------------------------------------------------------
// Vertical Slice Seed Data Type
// ---------------------------------------------------------------------------

/**
 * Typed seed data for the Challenger + Wake Up vertical slice.
 *
 * This type constrains the seed data to only the vertical slice scope:
 * face is always 'challenger', waveMove is always 'wakeUp'.
 * Used by the seed data module to ensure type safety at authoring time.
 */
export interface VerticalSliceSeedData {
  intake: Omit<PassageTemplate, 'face' | 'waveMove' | 'id'> & {
    face: 'challenger'
    waveMove: 'wakeUp'
    phase: 'intake'
  }
  action: Omit<PassageTemplate, 'face' | 'waveMove' | 'id'> & {
    face: 'challenger'
    waveMove: 'wakeUp'
    phase: 'action'
  }
  reflection: Omit<ReflectionPassageTemplate, 'face' | 'waveMove' | 'id'> & {
    face: 'challenger'
    waveMove: 'wakeUp'
    phase: 'reflection'
  }
}
