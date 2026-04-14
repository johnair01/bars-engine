/**
 * Alchemy Engine — Template Bank Lookup / Query Service
 *
 * Retrieves passage content by face, WAVE move, and phase WITHOUT requiring AI.
 * This is the non-AI first-class path: all template content is GM-authored and
 * statically available in the template bank.
 *
 * The service:
 * 1. Maintains a lazily-initialized singleton bank (no unnecessary rebuilds)
 * 2. Implements TemplateBankQuery → TemplateBankLookupResult lookup
 * 3. Resolves channel-specific content from ChannelContentSlots
 * 4. Returns fully-resolved passages ready for rendering
 * 5. Handles not-found cases with clear error reasons
 *
 * Vertical slice scope: Challenger face + Wake Up WAVE move only.
 *
 * @see template-bank-types.ts — TemplateBankQuery, TemplateBankLookupResult, PassageTemplate
 * @see template-bank-data.ts — buildVerticalSliceBank, seed data
 * @see types.ts — ArcPhase, PHASE_REGULATION_MAP, VERTICAL_SLICE
 */

import type { EmotionalChannel, GameMasterFace, PersonalMoveType } from '@/lib/quest-grammar/types'
import type {
  TemplateBankQuery,
  TemplateBankLookupResult,
  PassageTemplate,
  ReflectionPassageTemplate,
  TemplateBank,
  TemplateBankKeyString,
  PassageChoice,
} from './template-bank-types'
import {
  toTemplateBankKey,
  resolveChannelContent,
  isReflectionPassage,
} from './template-bank-types'
import { buildVerticalSliceBank } from './template-bank-data'
import type { ArcPhase, RegulationState } from './types'
import { PHASE_REGULATION_MAP, isArcPhase } from './types'

// ---------------------------------------------------------------------------
// Resolved Passage (channel content already applied)
// ---------------------------------------------------------------------------

/**
 * A passage with all channel-typed content slots resolved to strings.
 * Ready for rendering — no further channel resolution needed.
 *
 * Distinct from passage-resolver's ResolvedPassage (which includes AI source attribution).
 * This type is the pure template bank output: coordinate keys, choices, and regulation context.
 */
export interface TemplateBankPassage {
  /** Template ID for traceability. */
  id: string
  /** Human-readable title. */
  title: string
  /** Coordinate keys. */
  face: GameMasterFace
  waveMove: PersonalMoveType
  phase: ArcPhase
  /** Regulation context. */
  regulationFrom: RegulationState
  regulationTo: RegulationState
  /** Resolved narrative content (channel applied). */
  situation: string
  friction: string
  invitation: string
  /** Resolved choices (channel applied to labels + consequences). */
  choices: ResolvedChoice[]
  /** The channel used for resolution (null = default content). */
  resolvedChannel: EmotionalChannel | null
  /** GM advice (admin-only, not player-facing). */
  gmAdvice?: string
  /** AI prompt hint (for AI-augmented path). */
  aiPromptHint?: string
}

/** A choice with channel content resolved to plain strings. */
export interface ResolvedChoice {
  key: string
  label: string
  consequence: string
  regulationEffect: 'advance' | 'sustain' | 'regress'
  channelAffinity?: EmotionalChannel
  challengerMoveId?: string
}

/**
 * Resolved Reflection passage — includes epiphany fields.
 */
export interface TemplateBankReflectionPassage extends TemplateBankPassage {
  phase: 'reflection'
  /** Resolved epiphany prompt. */
  epiphanyPrompt: string
  /** Resolved seed phrases (newline-delimited string). */
  epiphanySeedPhrases: string
  /** Parsed seed phrases as array. */
  epiphanySeedPhraseList: string[]
  /** Whether freeform epiphany input is allowed. */
  allowFreeformEpiphany: boolean
}

// ---------------------------------------------------------------------------
// Singleton bank instance (lazy init)
// ---------------------------------------------------------------------------

let _bank: TemplateBank | null = null

/**
 * Get or initialize the template bank singleton.
 * Lazily built on first access — avoids rebuilding on every lookup.
 */
function getBank(): TemplateBank {
  if (!_bank) {
    _bank = buildVerticalSliceBank()
  }
  return _bank
}

/**
 * Reset the bank singleton (for testing or after bank updates).
 * @internal — exposed for tests only.
 */
export function _resetBankForTesting(): void {
  _bank = null
}

// ---------------------------------------------------------------------------
// Core Lookup
// ---------------------------------------------------------------------------

/**
 * Look up a passage template by face, WAVE move, and phase.
 *
 * Returns a discriminated union:
 * - `{ found: true, template }` when a matching template exists
 * - `{ found: false, key, reason }` when no match is found
 *
 * This is the raw lookup — returns the unresolved PassageTemplate.
 * For channel-resolved content, use `queryPassage()` instead.
 */
export function lookupTemplate(query: TemplateBankQuery): TemplateBankLookupResult {
  // Validate phase
  if (!isArcPhase(query.phase)) {
    const key = `${query.face}::${query.waveMove}::${query.phase}` as TemplateBankKeyString
    return { found: false, key, reason: `Invalid phase: ${query.phase}` }
  }

  const bank = getBank()
  const key = toTemplateBankKey({
    face: query.face,
    waveMove: query.waveMove,
    phase: query.phase,
  })

  const template = bank.templates.get(key)

  if (!template) {
    return {
      found: false,
      key,
      reason: `No template found for ${key}. Available templates: ${Array.from(bank.templates.keys()).join(', ')}`,
    }
  }

  return { found: true, template }
}

// ---------------------------------------------------------------------------
// Channel-Resolved Query
// ---------------------------------------------------------------------------

/**
 * Query the template bank and return a fully channel-resolved passage.
 *
 * This is the primary API for the non-AI path:
 * 1. Looks up the template by (face, waveMove, phase)
 * 2. Resolves all ChannelContentSlots using the player's channel
 * 3. Returns a ResolvedPassage ready for rendering
 *
 * If no channel is provided, default content is used (non-AI first-class).
 *
 * @example
 * ```ts
 * const result = queryPassage({
 *   face: 'challenger',
 *   waveMove: 'wakeUp',
 *   phase: 'intake',
 *   channel: 'Fear',
 * })
 * if (result.found) {
 *   console.log(result.passage.situation) // Fear-specific intake text
 * }
 * ```
 */
export function queryPassage(
  query: TemplateBankQuery,
): { found: true; passage: TemplateBankPassage } | { found: false; key: TemplateBankKeyString; reason: string } {
  const lookupResult = lookupTemplate(query)

  if (!lookupResult.found) {
    return { found: false, key: lookupResult.key, reason: lookupResult.reason }
  }

  const template = lookupResult.template
  const channel = query.channel ?? null

  const passage = resolvePassageTemplate(template, channel)

  return { found: true, passage }
}

/**
 * Query specifically for a Reflection passage with epiphany fields.
 *
 * Returns a ResolvedReflectionPassage with epiphany prompt, seed phrases,
 * and freeform flag — everything needed to render the Reflection phase
 * where the BAR IS the epiphany.
 */
export function queryReflectionPassage(
  query: Omit<TemplateBankQuery, 'phase'>,
): { found: true; passage: TemplateBankReflectionPassage } | { found: false; key: TemplateBankKeyString; reason: string } {
  const fullQuery: TemplateBankQuery = { ...query, phase: 'reflection' }
  const lookupResult = lookupTemplate(fullQuery)

  if (!lookupResult.found) {
    return { found: false, key: lookupResult.key, reason: lookupResult.reason }
  }

  const template = lookupResult.template
  if (!isReflectionPassage(template)) {
    const key = toTemplateBankKey({ face: query.face, waveMove: query.waveMove, phase: 'reflection' })
    return {
      found: false,
      key,
      reason: `Template found but is not a ReflectionPassageTemplate (missing epiphany fields)`,
    }
  }

  const channel = query.channel ?? null
  const passage = resolveReflectionPassage(template, channel)

  return { found: true, passage }
}

// ---------------------------------------------------------------------------
// Resolution Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a PassageTemplate into a TemplateBankPassage using the given channel.
 */
function resolvePassageTemplate(
  template: PassageTemplate,
  channel: EmotionalChannel | null,
): TemplateBankPassage {
  return {
    id: template.id,
    title: template.title,
    face: template.face,
    waveMove: template.waveMove,
    phase: template.phase,
    regulationFrom: template.regulationFrom,
    regulationTo: template.regulationTo,
    situation: resolveChannelContent(template.situation, channel),
    friction: resolveChannelContent(template.friction, channel),
    invitation: resolveChannelContent(template.invitation, channel),
    choices: resolveChoices(template.choices, channel),
    resolvedChannel: channel,
    gmAdvice: template.gmAdvice,
    aiPromptHint: template.aiPromptHint,
  }
}

/**
 * Resolve a ReflectionPassageTemplate into a ResolvedReflectionPassage.
 */
function resolveReflectionPassage(
  template: ReflectionPassageTemplate,
  channel: EmotionalChannel | null,
): TemplateBankReflectionPassage {
  const base = resolvePassageTemplate(template, channel)
  const seedPhrases = resolveChannelContent(template.epiphanySeedPhrases, channel)

  return {
    ...base,
    phase: 'reflection' as const,
    epiphanyPrompt: resolveChannelContent(template.epiphanyPrompt, channel),
    epiphanySeedPhrases: seedPhrases,
    epiphanySeedPhraseList: parseSeedPhrases(seedPhrases),
    allowFreeformEpiphany: template.allowFreeformEpiphany,
  }
}

/** Resolve all choices, applying channel content to labels and consequences. */
function resolveChoices(
  choices: PassageChoice[],
  channel: EmotionalChannel | null,
): ResolvedChoice[] {
  return choices.map((choice) => ({
    key: choice.key,
    label: resolveChannelContent(choice.label, channel),
    consequence: resolveChannelContent(choice.consequence, channel),
    regulationEffect: choice.regulationEffect,
    channelAffinity: choice.channelAffinity,
    challengerMoveId: choice.challengerMoveId,
  }))
}

/** Parse newline-delimited seed phrases into an array. */
function parseSeedPhrases(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Convenience: Vertical Slice Shortcuts
// ---------------------------------------------------------------------------

/**
 * Get a resolved passage for the vertical slice (Challenger + Wake Up)
 * by phase and optional channel.
 *
 * Shortcut for the most common lookup during the vertical slice.
 *
 * @throws Error if the vertical slice template is somehow missing
 */
export function getVerticalSlicePassage(
  phase: ArcPhase,
  channel?: EmotionalChannel,
): TemplateBankPassage {
  const result = queryPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    phase,
    channel,
  })

  if (!result.found) {
    throw new Error(`Vertical slice template missing for phase '${phase}': ${result.reason}`)
  }

  return result.passage
}

/**
 * Get the resolved Reflection passage for the vertical slice.
 * Guarantees epiphany fields are present.
 *
 * @throws Error if the reflection template is somehow missing
 */
export function getVerticalSliceReflection(
  channel?: EmotionalChannel,
): TemplateBankReflectionPassage {
  const result = queryReflectionPassage({
    face: 'challenger',
    waveMove: 'wakeUp',
    channel,
  })

  if (!result.found) {
    throw new Error(`Vertical slice reflection template missing: ${result.reason}`)
  }

  return result.passage
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a template exists for the given query.
 * Lightweight check that doesn't resolve channel content.
 */
export function hasTemplate(
  face: GameMasterFace,
  waveMove: PersonalMoveType,
  phase: ArcPhase,
): boolean {
  const bank = getBank()
  const key = toTemplateBankKey({ face, waveMove, phase })
  return bank.templates.has(key)
}

/**
 * Validate that a complete arc (all 3 phases) has templates.
 * Returns missing phases, if any.
 */
export function validateArcCoverage(
  face: GameMasterFace,
  waveMove: PersonalMoveType,
): { complete: boolean; missingPhases: ArcPhase[] } {
  const phases: ArcPhase[] = ['intake', 'action', 'reflection']
  const missing = phases.filter((phase) => !hasTemplate(face, waveMove, phase))
  return {
    complete: missing.length === 0,
    missingPhases: missing,
  }
}

/**
 * Get the expected regulation state for entering a phase.
 * Useful for UI to show/disable phases based on player regulation.
 */
export function getPhaseRegulationRequirement(phase: ArcPhase): {
  requiredRegulation: RegulationState
  targetRegulation: RegulationState
} {
  const map = PHASE_REGULATION_MAP[phase]
  return {
    requiredRegulation: map.from,
    targetRegulation: map.to,
  }
}

/**
 * List all available template keys in the bank.
 * Useful for admin/debug views.
 */
export function listTemplateKeys(): TemplateBankKeyString[] {
  const bank = getBank()
  return Array.from(bank.templates.keys())
}

/**
 * Get bank metadata (version, name, completed arcs).
 */
export function getBankMetadata() {
  return getBank().metadata
}
