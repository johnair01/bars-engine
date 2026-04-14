/**
 * CYOA Composer — Branch-Visibility Filtering Engine
 *
 * Given a set of locked choices (from the ComposerDataBag or CyoaBuildState),
 * computes which subsequent branches / options are visible or hidden for
 * each remaining composer step. Returns a filtered option set per step.
 *
 * Design principles:
 *   - Pure functions, no side effects, fully testable
 *   - Face-routing correctness: portraysFace links correctly filter branches
 *   - Emotional-vector compatibility narrows narrative template options
 *   - Locked choices are NEVER reversible — filtering is monotonically narrowing
 *   - Works with the existing GameMasterFace 6-face enum (unaltered)
 *
 * @see src/lib/cyoa-composer/types.ts — ComposerDataBag, ComposerStepId
 * @see src/lib/cyoa-build/types.ts — CyoaBuild, CyoaBuildDraft
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, EmotionalVector
 */

import type { GameMasterFace, EmotionalVector, PersonalMoveType } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'
import type { ComposerDataBag, ComposerStepId } from './types'

// ─── Option Types ───────────────────────────────────────────────────────────

/**
 * A selectable face option with visibility metadata.
 */
export interface FaceOption {
  face: GameMasterFace
  label: string
  /** Whether this option is visible given current locked choices */
  visible: boolean
  /** Human-readable reason if hidden (for GM debugging / accessibility) */
  hiddenReason?: string
}

/**
 * A selectable narrative template option with visibility metadata.
 */
export interface NarrativeTemplateOption {
  templateKey: string
  templateKind: string
  label: string
  /** Faces this template is compatible with (empty = universal) */
  compatibleFaces: GameMasterFace[]
  /** Emotional channels this template is designed for (empty = universal) */
  compatibleChannels: string[]
  /** Whether this option is visible given current locked choices */
  visible: boolean
  /** Human-readable reason if hidden */
  hiddenReason?: string
}

/**
 * A selectable WAVE move option with visibility metadata.
 */
export interface WaveMoveOption {
  move: PersonalMoveType
  label: string
  /** Whether this option is visible given current locked choices */
  visible: boolean
  /** Human-readable reason if hidden */
  hiddenReason?: string
}

/**
 * Complete filtered option set for all composer steps.
 * Each step has its own array of options with visibility computed.
 */
export interface FilteredOptionSet {
  /** Visible face options for face_selection step */
  faces: FaceOption[]
  /** Visible narrative template options for narrative_template step */
  narrativeTemplates: NarrativeTemplateOption[]
  /** Visible WAVE move options (if applicable) */
  waveMoves: WaveMoveOption[]
  /** Summary: how many total options vs visible per step */
  summary: StepVisibilitySummary[]
}

/**
 * Per-step visibility summary for progress indicators.
 */
export interface StepVisibilitySummary {
  stepId: ComposerStepId
  totalOptions: number
  visibleOptions: number
  /** True if step is fully constrained (0 or 1 visible options) */
  autoResolved: boolean
}

// ─── Constraint Specification ───────────────────────────────────────────────

/**
 * Constraint set extracted from locked choices.
 * Immutable snapshot used by all filter functions.
 */
export interface BranchConstraints {
  /** Locked face (if any) — narrows template + NPC options */
  lockedFace: GameMasterFace | null
  /** Locked emotional vector (if any) — narrows templates by channel */
  lockedChannel: string | null
  /** Locked emotional altitude (if any) */
  lockedAltitude: string | null
  /** Locked narrative template (if any) — constrains downstream choices */
  lockedTemplateKey: string | null
  /** Faces explicitly excluded by campaign/GM rules */
  excludedFaces: GameMasterFace[]
  /** Templates explicitly excluded by campaign/GM rules */
  excludedTemplateKeys: string[]
}

// ─── Constraint Extraction ──────────────────────────────────────────────────

/**
 * Extract branch constraints from the current ComposerDataBag.
 * This is the single source of truth for what the player has locked.
 *
 * @param dataBag — current accumulated composer data
 * @param campaignExclusions — optional GM-configured exclusions
 * @returns Immutable constraint snapshot
 */
export function extractConstraints(
  dataBag: ComposerDataBag,
  campaignExclusions?: {
    excludedFaces?: GameMasterFace[]
    excludedTemplateKeys?: string[]
  },
): BranchConstraints {
  return {
    lockedFace: dataBag.lockedFace ?? null,
    lockedChannel: dataBag.channel ?? null,
    lockedAltitude: dataBag.altitude ?? null,
    lockedTemplateKey: dataBag.narrativeTemplateId ?? null,
    excludedFaces: campaignExclusions?.excludedFaces ?? [],
    excludedTemplateKeys: campaignExclusions?.excludedTemplateKeys ?? [],
  }
}

// ─── Face Filtering ─────────────────────────────────────────────────────────

/** Human-readable labels for each face (matches FACE_META pattern). */
const FACE_LABELS: Record<GameMasterFace, string> = {
  shaman: 'Shaman',
  challenger: 'Challenger',
  regent: 'Regent',
  architect: 'Architect',
  diplomat: 'Diplomat',
  sage: 'Sage',
}

/**
 * Compute visible face options given current constraints.
 *
 * Rules:
 *   1. If a face is already locked, only that face is visible (confirmed selection).
 *   2. Campaign-excluded faces are hidden.
 *   3. All other faces remain visible.
 *
 * @param constraints — current branch constraints
 * @returns Array of FaceOption with visibility computed
 */
export function filterFaceOptions(constraints: BranchConstraints): FaceOption[] {
  return GAME_MASTER_FACES.map((face): FaceOption => {
    // Rule 1: Face already locked — only the locked face is visible
    if (constraints.lockedFace !== null) {
      if (face === constraints.lockedFace) {
        return { face, label: FACE_LABELS[face], visible: true }
      }
      return {
        face,
        label: FACE_LABELS[face],
        visible: false,
        hiddenReason: `Face already locked to ${FACE_LABELS[constraints.lockedFace]}`,
      }
    }

    // Rule 2: Campaign-excluded faces
    if (constraints.excludedFaces.includes(face)) {
      return {
        face,
        label: FACE_LABELS[face],
        visible: false,
        hiddenReason: 'Excluded by campaign configuration',
      }
    }

    // Rule 3: Available
    return { face, label: FACE_LABELS[face], visible: true }
  })
}

// ─── Narrative Template Filtering ───────────────────────────────────────────

/**
 * Template catalog entry — the minimal shape needed for filtering.
 * The full NarrativeTemplate lives in the registry; this is the
 * filtering-relevant subset.
 */
export interface TemplateCatalogEntry {
  templateKey: string
  templateKind: string
  label: string
  /** Faces this template is designed for (empty = universal / face-agnostic) */
  compatibleFaces: GameMasterFace[]
  /** Emotional channels this template is designed for (empty = universal) */
  compatibleChannels: string[]
}

/**
 * Compute visible narrative template options given current constraints
 * and the available template catalog.
 *
 * Rules:
 *   1. If a template is already locked, only that template is visible.
 *   2. Campaign-excluded templates are hidden.
 *   3. If a face is locked, only face-compatible templates are visible.
 *      (Templates with empty compatibleFaces are universal — always visible.)
 *   4. If a channel is locked, only channel-compatible templates are visible.
 *      (Templates with empty compatibleChannels are universal — always visible.)
 *
 * @param catalog — available narrative templates
 * @param constraints — current branch constraints
 * @returns Array of NarrativeTemplateOption with visibility computed
 */
export function filterNarrativeTemplateOptions(
  catalog: TemplateCatalogEntry[],
  constraints: BranchConstraints,
): NarrativeTemplateOption[] {
  return catalog.map((entry): NarrativeTemplateOption => {
    const base: Omit<NarrativeTemplateOption, 'visible' | 'hiddenReason'> = {
      templateKey: entry.templateKey,
      templateKind: entry.templateKind,
      label: entry.label,
      compatibleFaces: entry.compatibleFaces,
      compatibleChannels: entry.compatibleChannels,
    }

    // Rule 1: Template already locked
    if (constraints.lockedTemplateKey !== null) {
      if (entry.templateKey === constraints.lockedTemplateKey) {
        return { ...base, visible: true }
      }
      return {
        ...base,
        visible: false,
        hiddenReason: `Template already locked to ${constraints.lockedTemplateKey}`,
      }
    }

    // Rule 2: Campaign-excluded templates
    if (constraints.excludedTemplateKeys.includes(entry.templateKey)) {
      return {
        ...base,
        visible: false,
        hiddenReason: 'Excluded by campaign configuration',
      }
    }

    // Rule 3: Face compatibility
    if (
      constraints.lockedFace !== null &&
      entry.compatibleFaces.length > 0 &&
      !entry.compatibleFaces.includes(constraints.lockedFace)
    ) {
      return {
        ...base,
        visible: false,
        hiddenReason: `Not compatible with locked face: ${FACE_LABELS[constraints.lockedFace]}`,
      }
    }

    // Rule 4: Channel compatibility
    if (
      constraints.lockedChannel !== null &&
      entry.compatibleChannels.length > 0 &&
      !entry.compatibleChannels.includes(constraints.lockedChannel)
    ) {
      return {
        ...base,
        visible: false,
        hiddenReason: `Not compatible with locked channel: ${constraints.lockedChannel}`,
      }
    }

    return { ...base, visible: true }
  })
}

// ─── WAVE Move Filtering ────────────────────────────────────────────────────

/** All valid WAVE moves. */
const ALL_WAVE_MOVES: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

/** Human-readable labels for WAVE moves. */
const WAVE_MOVE_LABELS: Record<PersonalMoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

/**
 * Mapping of face → recommended WAVE moves.
 *
 * Each face has an affinity for certain WAVE stages based on its
 * developmental role. This is a soft filter — all moves remain
 * visible but non-recommended moves get a lower sort priority
 * in the UI. Only hard exclusions (via GM config) actually hide moves.
 *
 * This mapping follows the existing face × move patterns in
 * gm-face-stage-moves.ts and face-move-passages.ts.
 */
export const FACE_MOVE_AFFINITY: Record<GameMasterFace, PersonalMoveType[]> = {
  shaman: ['wakeUp', 'growUp'],
  challenger: ['wakeUp', 'showUp'],
  regent: ['cleanUp', 'showUp'],
  architect: ['cleanUp', 'growUp'],
  diplomat: ['growUp', 'cleanUp'],
  sage: ['wakeUp', 'cleanUp', 'growUp', 'showUp'], // Sage integrates all
}

/**
 * Optional move restrictions — GM can exclude specific moves per campaign.
 */
export interface WaveMoveRestrictions {
  /** Moves explicitly excluded by the GM */
  excludedMoves?: PersonalMoveType[]
  /** If set, ONLY these moves are available (whitelist overrides blacklist) */
  allowedMoves?: PersonalMoveType[]
}

/**
 * Compute visible WAVE move options given current constraints.
 *
 * Rules:
 *   1. If allowedMoves whitelist is set, only those moves are visible.
 *   2. excludedMoves are hidden.
 *   3. All remaining moves are visible.
 *
 * Note: Face-move affinity is informational only — it affects sort order
 * in the UI, not visibility. Visibility is binary (shown/hidden).
 *
 * @param constraints — current branch constraints
 * @param restrictions — optional GM-configured move restrictions
 * @returns Array of WaveMoveOption with visibility computed
 */
export function filterWaveMoveOptions(
  constraints: BranchConstraints,
  restrictions?: WaveMoveRestrictions,
): WaveMoveOption[] {
  return ALL_WAVE_MOVES.map((move): WaveMoveOption => {
    // Rule 1: Whitelist (takes precedence)
    if (restrictions?.allowedMoves && restrictions.allowedMoves.length > 0) {
      if (!restrictions.allowedMoves.includes(move)) {
        return {
          move,
          label: WAVE_MOVE_LABELS[move],
          visible: false,
          hiddenReason: 'Not in allowed moves for this campaign',
        }
      }
    }

    // Rule 2: Blacklist
    if (restrictions?.excludedMoves?.includes(move)) {
      return {
        move,
        label: WAVE_MOVE_LABELS[move],
        visible: false,
        hiddenReason: 'Excluded by campaign configuration',
      }
    }

    // Rule 3: Available
    return { move, label: WAVE_MOVE_LABELS[move], visible: true }
  })
}

// ─── Composite Filter — Full Option Set ─────────────────────────────────────

/**
 * Campaign-level exclusion configuration.
 * Stored as JSON in campaign config (follows existing JSON-blob patterns).
 */
export interface CampaignBranchConfig {
  /** Faces excluded from the campaign */
  excludedFaces?: GameMasterFace[]
  /** Template keys excluded from the campaign */
  excludedTemplateKeys?: string[]
  /** WAVE move restrictions */
  waveMoveRestrictions?: WaveMoveRestrictions
}

/**
 * Compute the complete filtered option set for all composer steps,
 * given the current data bag, available templates, and campaign config.
 *
 * This is the primary entry point for the branch-visibility engine.
 * The composer UI calls this once per render cycle to determine which
 * options to show for each step.
 *
 * @param dataBag — current accumulated composer data (locked choices)
 * @param templateCatalog — available narrative templates
 * @param campaignConfig — optional GM-configured branch restrictions
 * @returns Complete filtered option set with per-step summaries
 *
 * @example
 * ```ts
 * const options = computeFilteredOptions(
 *   { lockedFace: 'shaman', channel: 'Fear' },
 *   narrativeTemplates,
 *   { excludedFaces: ['sage'] },
 * )
 * // options.faces → only 'shaman' visible (locked)
 * // options.narrativeTemplates → filtered by shaman + Fear compatibility
 * ```
 */
export function computeFilteredOptions(
  dataBag: ComposerDataBag,
  templateCatalog: TemplateCatalogEntry[],
  campaignConfig?: CampaignBranchConfig,
): FilteredOptionSet {
  const constraints = extractConstraints(dataBag, {
    excludedFaces: campaignConfig?.excludedFaces,
    excludedTemplateKeys: campaignConfig?.excludedTemplateKeys,
  })

  const faces = filterFaceOptions(constraints)
  const narrativeTemplates = filterNarrativeTemplateOptions(templateCatalog, constraints)
  const waveMoves = filterWaveMoveOptions(constraints, campaignConfig?.waveMoveRestrictions)

  const summary = buildVisibilitySummary(faces, narrativeTemplates, waveMoves, dataBag)

  return { faces, narrativeTemplates, waveMoves, summary }
}

// ─── Summary Builder ────────────────────────────────────────────────────────

function buildVisibilitySummary(
  faces: FaceOption[],
  templates: NarrativeTemplateOption[],
  _moves: WaveMoveOption[],
  dataBag: ComposerDataBag,
): StepVisibilitySummary[] {
  const visibleFaces = faces.filter((f) => f.visible).length
  const visibleTemplates = templates.filter((t) => t.visible).length
  // moves param reserved for future WAVE-move step summary; currently
  // WAVE moves are resolved within the narrative_template step.

  return [
    {
      stepId: 'emotional_checkin',
      totalOptions: 1, // Check-in is a single input, not a selection
      visibleOptions: dataBag.emotionalVector != null ? 0 : 1,
      autoResolved: dataBag.emotionalVector != null,
    },
    {
      stepId: 'face_selection',
      totalOptions: faces.length,
      visibleOptions: visibleFaces,
      autoResolved: visibleFaces <= 1,
    },
    {
      stepId: 'narrative_template',
      totalOptions: templates.length,
      visibleOptions: visibleTemplates,
      autoResolved: visibleTemplates <= 1,
    },
    {
      stepId: 'charge_text',
      totalOptions: 1, // Free-text input
      visibleOptions: dataBag.chargeText != null ? 0 : 1,
      autoResolved: dataBag.chargeText != null,
    },
    {
      stepId: 'confirmation',
      totalOptions: 1,
      visibleOptions: 1,
      autoResolved: false, // Confirmation is never auto-resolved
    },
  ]
}

// ─── Utility: Get Visible Subset ────────────────────────────────────────────

/**
 * Extract only visible options from a filtered array.
 * Convenience function for UI rendering.
 */
export function getVisibleFaces(options: FaceOption[]): FaceOption[] {
  return options.filter((o) => o.visible)
}

/**
 * Extract only visible narrative template options.
 */
export function getVisibleTemplates(
  options: NarrativeTemplateOption[],
): NarrativeTemplateOption[] {
  return options.filter((o) => o.visible)
}

/**
 * Extract only visible WAVE move options.
 */
export function getVisibleMoves(options: WaveMoveOption[]): WaveMoveOption[] {
  return options.filter((o) => o.visible)
}

// ─── Utility: Auto-Resolution Detection ─────────────────────────────────────

/**
 * Check if a step can be auto-resolved (exactly 1 visible option).
 * When auto-resolved, the composer can skip user interaction and
 * automatically lock the single remaining choice.
 *
 * @param options — filtered option set from computeFilteredOptions
 * @param stepId — which step to check
 * @returns The single auto-resolvable value, or null if manual selection needed
 */
export function getAutoResolvedValue(
  options: FilteredOptionSet,
  stepId: ComposerStepId,
): GameMasterFace | string | PersonalMoveType | null {
  switch (stepId) {
    case 'face_selection': {
      const visible = getVisibleFaces(options.faces)
      return visible.length === 1 ? visible[0]!.face : null
    }
    case 'narrative_template': {
      const visible = getVisibleTemplates(options.narrativeTemplates)
      return visible.length === 1 ? visible[0]!.templateKey : null
    }
    default:
      return null
  }
}

// ─── Utility: Face Affinity Ordering ────────────────────────────────────────

/**
 * Sort visible face options by affinity to the current emotional state.
 * Faces whose WAVE move affinity aligns with the emotional vector's
 * implied move family get sorted first. This is a UX enhancement,
 * not a filter — all visible faces remain visible.
 *
 * @param faces — face options (pre-filtered for visibility)
 * @param emotionalVector — current emotional vector (if available)
 * @returns Same array, re-sorted by affinity (highest first)
 */
export function sortFacesByAffinity(
  faces: FaceOption[],
  emotionalVector?: EmotionalVector | null,
): FaceOption[] {
  if (!emotionalVector) return faces

  // Transcend (same channel) → inward moves (wakeUp, growUp)
  // Translate (different channel) → outward moves (cleanUp, showUp)
  const isSameChannel = emotionalVector.channelFrom === emotionalVector.channelTo
  const preferredMoves: PersonalMoveType[] = isSameChannel
    ? ['wakeUp', 'growUp']
    : ['cleanUp', 'showUp']

  return [...faces].sort((a, b) => {
    if (!a.visible && !b.visible) return 0
    if (!a.visible) return 1
    if (!b.visible) return -1

    const aAffinity = FACE_MOVE_AFFINITY[a.face]
    const bAffinity = FACE_MOVE_AFFINITY[b.face]
    const aScore = preferredMoves.filter((m) => aAffinity.includes(m)).length
    const bScore = preferredMoves.filter((m) => bAffinity.includes(m)).length
    return bScore - aScore // Higher affinity first
  })
}

// ─── Re-export key types for barrel ─────────────────────────────────────────

export type {
  GameMasterFace,
  EmotionalVector,
  PersonalMoveType,
} from '@/lib/quest-grammar/types'
