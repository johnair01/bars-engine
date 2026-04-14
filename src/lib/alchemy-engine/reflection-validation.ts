/**
 * Alchemy Engine — Reflection Option Validation Layer
 *
 * Runtime validation ensuring generated suggestions (both static and AI)
 * conform to channel-typed BAR requirements and epiphany artifact structure.
 *
 * Validates:
 *   1. Individual suggestion shape and content constraints
 *   2. Completion set structural invariants (3 suggestions, unique keys/channels)
 *   3. Key↔framing consistency (channel_aligned=direct, adjacent=generative, cross=challenging)
 *   4. Wuxing cycle compliance (adjacent/cross channels follow shēng/kè cycles)
 *   5. BAR conformance (suggestion can produce a valid Reflection BAR with isEpiphany: true)
 *   6. Epiphany artifact invariant (Reflection BAR IS the epiphany — no separate model)
 *
 * Non-AI first-class: validation applies equally to static and AI-generated suggestions.
 * The AI path runs through the same validation before suggestions enter the system.
 *
 * @see reflection-generation.ts — produces suggestions validated here
 * @see bar-production.ts — buildReflectionBarData consumes validated suggestions
 * @see types.ts — PHASE_REGULATION_MAP, VERTICAL_SLICE
 */

import { z } from 'zod'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import type { ReflectionCompletionSuggestion, ReflectionCompletionSet } from './reflection-generation'
import type { ReflectionBarMetadata, BarCreateData } from './bar-production'
import { buildReflectionBarData } from './bar-production'
import { PHASE_REGULATION_MAP, VERTICAL_SLICE } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Valid emotional channels (title-case, as used in the type system). */
export const VALID_CHANNELS: readonly EmotionalChannel[] = [
  'Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality',
] as const

/** Valid suggestion keys — one per framing angle. */
export const VALID_SUGGESTION_KEYS = ['channel_aligned', 'adjacent', 'cross'] as const
export type SuggestionKey = (typeof VALID_SUGGESTION_KEYS)[number]

/** Valid framing types — maps 1:1 with suggestion keys. */
export const VALID_FRAMINGS = ['direct', 'generative', 'challenging'] as const
export type SuggestionFraming = (typeof VALID_FRAMINGS)[number]

/**
 * Canonical key → framing mapping.
 * Each suggestion key MUST pair with exactly one framing.
 */
export const KEY_FRAMING_MAP: Record<SuggestionKey, SuggestionFraming> = {
  channel_aligned: 'direct',
  adjacent: 'generative',
  cross: 'challenging',
} as const

/** Valid Wuxing elements (title-case). */
const VALID_ELEMENTS = ['Metal', 'Water', 'Wood', 'Fire', 'Earth'] as const

/**
 * Channel → element mapping for validation.
 * Must stay in sync with CHANNEL_THEME in reflection-generation.ts
 * and ELEMENTS in quest-grammar/elements.ts.
 */
export const CHANNEL_ELEMENT_MAP: Record<EmotionalChannel, string> = {
  Fear: 'Metal',
  Anger: 'Fire',
  Sadness: 'Water',
  Joy: 'Wood',
  Neutrality: 'Earth',
}

/**
 * shēng (生) generative cycle neighbors.
 * Must stay in sync with SHENG_NEIGHBOR in reflection-generation.ts.
 */
export const SHENG_NEIGHBOR: Record<EmotionalChannel, EmotionalChannel> = {
  Joy: 'Anger',        // Wood → Fire
  Anger: 'Neutrality', // Fire → Earth
  Neutrality: 'Fear',  // Earth → Metal
  Fear: 'Sadness',     // Metal → Water
  Sadness: 'Joy',      // Water → Wood
}

/**
 * kè (克) control cycle neighbors.
 * Must stay in sync with KE_NEIGHBOR in reflection-generation.ts.
 */
export const KE_NEIGHBOR: Record<EmotionalChannel, EmotionalChannel> = {
  Joy: 'Neutrality',   // Wood overcomes Earth
  Neutrality: 'Sadness', // Earth overcomes Water
  Sadness: 'Anger',    // Water overcomes Fire
  Anger: 'Fear',       // Fire overcomes Metal
  Fear: 'Joy',         // Metal overcomes Wood
}

// ---------------------------------------------------------------------------
// Content constraints
// ---------------------------------------------------------------------------

/** Minimum body length for a suggestion (ensures substance). */
export const MIN_BODY_LENGTH = 20

/** Maximum body length for a suggestion (prevents runaway AI output). */
export const MAX_BODY_LENGTH = 2000

/** Minimum title length. */
export const MIN_TITLE_LENGTH = 3

/** Maximum title length. */
export const MAX_TITLE_LENGTH = 200

/** Minimum label length. */
export const MIN_LABEL_LENGTH = 3

/** Maximum label length. */
export const MAX_LABEL_LENGTH = 120

// ---------------------------------------------------------------------------
// Zod schemas — runtime validation
// ---------------------------------------------------------------------------

/** Zod schema for EmotionalChannel. */
export const emotionalChannelSchema = z.enum(['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'])

/** Zod schema for Wuxing element. */
export const elementSchema = z.enum(['Metal', 'Water', 'Wood', 'Fire', 'Earth'])

/** Zod schema for suggestion key. */
export const suggestionKeySchema = z.enum(['channel_aligned', 'adjacent', 'cross'])

/** Zod schema for suggestion framing. */
export const suggestionFramingSchema = z.enum(['direct', 'generative', 'challenging'])

/** Zod schema for completion set source. */
export const completionSourceSchema = z.enum(['static', 'ai'])

/**
 * Zod schema for a single ReflectionCompletionSuggestion.
 *
 * Validates shape, content constraints, and type-level correctness.
 * Does NOT validate cross-suggestion invariants (that's done at the set level).
 */
export const reflectionSuggestionSchema = z.object({
  key: suggestionKeySchema,
  label: z.string().min(MIN_LABEL_LENGTH).max(MAX_LABEL_LENGTH),
  channel: emotionalChannelSchema,
  element: elementSchema,
  title: z.string().min(MIN_TITLE_LENGTH).max(MAX_TITLE_LENGTH),
  body: z.string().min(MIN_BODY_LENGTH).max(MAX_BODY_LENGTH),
  framing: suggestionFramingSchema,
}).describe('A single channel-typed reflection completion suggestion')

/**
 * Zod schema for the contextSummary inside a ReflectionCompletionSet.
 */
export const contextSummarySchema = z.object({
  playerId: z.string().min(1),
  channel: emotionalChannelSchema,
  face: z.string().min(1),
  waveMove: z.string().min(1),
  intakeBarId: z.string().min(1),
  actionBarId: z.string().min(1),
})

/**
 * Zod schema for a ReflectionCompletionSet (3 suggestions).
 *
 * Validates the tuple shape: exactly 3 suggestions.
 * Cross-suggestion invariants (unique keys, unique channels, key↔framing)
 * are validated by `validateCompletionSet()`.
 */
export const reflectionCompletionSetSchema = z.object({
  suggestions: z.tuple([
    reflectionSuggestionSchema,
    reflectionSuggestionSchema,
    reflectionSuggestionSchema,
  ]),
  source: completionSourceSchema,
  contextSummary: contextSummarySchema,
}).describe('A set of 3 channel-typed reflection completion suggestions')

// ---------------------------------------------------------------------------
// Validation error types
// ---------------------------------------------------------------------------

/** A single validation issue. */
export interface ValidationIssue {
  /** Machine-readable error code. */
  code: string
  /** Human-readable description. */
  message: string
  /** Path to the problematic field (e.g. 'suggestions[1].channel'). */
  path?: string
}

/** Result of a validation check. */
export interface ValidationResult {
  /** Whether the validation passed. */
  valid: boolean
  /** Issues found (empty array if valid). */
  issues: ValidationIssue[]
}

// ---------------------------------------------------------------------------
// Individual suggestion validation
// ---------------------------------------------------------------------------

/**
 * Validate a single ReflectionCompletionSuggestion.
 *
 * Checks:
 *   1. Zod schema conformance (shape + content constraints)
 *   2. Key↔framing consistency
 *   3. Channel↔element consistency (Wuxing mapping)
 */
export function validateSuggestion(
  suggestion: unknown,
): ValidationResult {
  const issues: ValidationIssue[] = []

  // ── 1. Zod shape validation ──────────────────────────────────────────
  const parseResult = reflectionSuggestionSchema.safeParse(suggestion)
  if (!parseResult.success) {
    for (const zodIssue of parseResult.error.issues) {
      issues.push({
        code: 'SCHEMA_VIOLATION',
        message: zodIssue.message,
        path: zodIssue.path.join('.'),
      })
    }
    return { valid: false, issues }
  }

  const s = parseResult.data

  // ── 2. Key↔framing consistency ──────────────────────────────────────
  const expectedFraming = KEY_FRAMING_MAP[s.key]
  if (s.framing !== expectedFraming) {
    issues.push({
      code: 'KEY_FRAMING_MISMATCH',
      message: `Suggestion key '${s.key}' must have framing '${expectedFraming}', got '${s.framing}'.`,
      path: 'framing',
    })
  }

  // ── 3. Channel↔element consistency (Wuxing mapping) ─────────────────
  const expectedElement = CHANNEL_ELEMENT_MAP[s.channel]
  if (s.element !== expectedElement) {
    issues.push({
      code: 'CHANNEL_ELEMENT_MISMATCH',
      message: `Channel '${s.channel}' must map to element '${expectedElement}', got '${s.element}'.`,
      path: 'element',
    })
  }

  return { valid: issues.length === 0, issues }
}

// ---------------------------------------------------------------------------
// Completion set validation (cross-suggestion invariants)
// ---------------------------------------------------------------------------

/**
 * Validate a complete ReflectionCompletionSet.
 *
 * Beyond individual suggestion validation, checks cross-suggestion invariants:
 *   1. Exactly 3 suggestions
 *   2. Unique suggestion keys (channel_aligned, adjacent, cross)
 *   3. Unique channels across all 3 suggestions
 *   4. Keys appear in canonical order
 *   5. All individual suggestions pass validation
 *   6. Source is 'static' or 'ai'
 *   7. Context summary is present and valid
 *
 * Optionally validates Wuxing cycle compliance when primaryChannel is provided:
 *   - 'adjacent' suggestion channel must be the shēng neighbor of primaryChannel
 *   - 'cross' suggestion channel must be the kè neighbor of primaryChannel
 *   - 'channel_aligned' suggestion channel must equal primaryChannel
 */
export function validateCompletionSet(
  set: unknown,
  primaryChannel?: EmotionalChannel,
): ValidationResult {
  const issues: ValidationIssue[] = []

  // ── 1. Zod schema validation ────────────────────────────────────────
  const parseResult = reflectionCompletionSetSchema.safeParse(set)
  if (!parseResult.success) {
    for (const zodIssue of parseResult.error.issues) {
      issues.push({
        code: 'SCHEMA_VIOLATION',
        message: zodIssue.message,
        path: zodIssue.path.join('.'),
      })
    }
    return { valid: false, issues }
  }

  const parsed = parseResult.data

  // ── 2. Validate each suggestion individually ────────────────────────
  for (let i = 0; i < parsed.suggestions.length; i++) {
    const suggestionResult = validateSuggestion(parsed.suggestions[i])
    for (const issue of suggestionResult.issues) {
      issues.push({
        ...issue,
        path: `suggestions[${i}].${issue.path ?? ''}`.replace(/\.$/, ''),
      })
    }
  }

  // ── 3. Unique keys ──────────────────────────────────────────────────
  const keys = parsed.suggestions.map((s) => s.key)
  const uniqueKeys = new Set(keys)
  if (uniqueKeys.size !== 3) {
    issues.push({
      code: 'DUPLICATE_KEYS',
      message: `Suggestions must have 3 unique keys, got: [${keys.join(', ')}].`,
      path: 'suggestions',
    })
  }

  // ── 4. Canonical key order ──────────────────────────────────────────
  const expectedOrder: SuggestionKey[] = ['channel_aligned', 'adjacent', 'cross']
  for (let i = 0; i < 3; i++) {
    if (keys[i] !== expectedOrder[i]) {
      issues.push({
        code: 'KEY_ORDER',
        message: `Suggestion ${i} should have key '${expectedOrder[i]}', got '${keys[i]}'.`,
        path: `suggestions[${i}].key`,
      })
    }
  }

  // ── 5. Unique channels ─────────────────────────────────────────────
  const channels = parsed.suggestions.map((s) => s.channel)
  const uniqueChannels = new Set(channels)
  if (uniqueChannels.size !== 3) {
    issues.push({
      code: 'DUPLICATE_CHANNELS',
      message: `Suggestions must have 3 unique channels, got: [${channels.join(', ')}].`,
      path: 'suggestions',
    })
  }

  // ── 6. Wuxing cycle compliance (when primaryChannel provided) ───────
  if (primaryChannel) {
    const aligned = parsed.suggestions.find((s) => s.key === 'channel_aligned')
    const adjacent = parsed.suggestions.find((s) => s.key === 'adjacent')
    const cross = parsed.suggestions.find((s) => s.key === 'cross')

    // channel_aligned must match primary
    if (aligned && aligned.channel !== primaryChannel) {
      issues.push({
        code: 'WUXING_ALIGNED_MISMATCH',
        message: `channel_aligned suggestion must use primary channel '${primaryChannel}', got '${aligned.channel}'.`,
        path: 'suggestions[0].channel',
      })
    }

    // adjacent must match shēng neighbor
    const expectedAdjacent = SHENG_NEIGHBOR[primaryChannel]
    if (adjacent && adjacent.channel !== expectedAdjacent) {
      issues.push({
        code: 'WUXING_SHENG_MISMATCH',
        message: `adjacent suggestion must use shēng neighbor '${expectedAdjacent}' for primary '${primaryChannel}', got '${adjacent.channel}'.`,
        path: 'suggestions[1].channel',
      })
    }

    // cross must match kè neighbor
    const expectedCross = KE_NEIGHBOR[primaryChannel]
    if (cross && cross.channel !== expectedCross) {
      issues.push({
        code: 'WUXING_KE_MISMATCH',
        message: `cross suggestion must use kè neighbor '${expectedCross}' for primary '${primaryChannel}', got '${cross.channel}'.`,
        path: 'suggestions[2].channel',
      })
    }
  }

  return { valid: issues.length === 0, issues }
}

// ---------------------------------------------------------------------------
// BAR conformance validation
// ---------------------------------------------------------------------------

/**
 * Validate that a chosen suggestion can produce a valid Reflection BAR
 * that conforms to the epiphany artifact structure.
 *
 * Checks:
 *   1. Suggestion passes individual validation
 *   2. buildReflectionBarData produces valid output
 *   3. BAR type is 'reflection'
 *   4. BAR nation matches the suggestion's channel (lowercase)
 *   5. BAR strandMetadata has isEpiphany: true
 *   6. BAR strandMetadata.regulation matches PHASE_REGULATION_MAP.reflection
 *   7. BAR strandMetadata.arcPhase is 'reflection'
 *   8. BAR content is non-empty (not just whitespace)
 */
export function validateSuggestionBarConformance(
  suggestion: ReflectionCompletionSuggestion,
  options?: {
    playerId?: string
    intakeBarId?: string
    actionBarId?: string
  },
): ValidationResult {
  const issues: ValidationIssue[] = []

  // ── 1. Validate suggestion shape ────────────────────────────────────
  const suggestionResult = validateSuggestion(suggestion)
  if (!suggestionResult.valid) {
    return suggestionResult
  }

  // ── 2. Build BAR data ───────────────────────────────────────────────
  let barData: BarCreateData
  try {
    barData = buildReflectionBarData({
      playerId: options?.playerId ?? 'validation-test',
      channel: suggestion.channel,
      content: suggestion.body,
      title: suggestion.title,
      intakeBarId: options?.intakeBarId,
      actionBarId: options?.actionBarId,
    })
  } catch (err) {
    issues.push({
      code: 'BAR_BUILD_FAILED',
      message: `buildReflectionBarData threw: ${err instanceof Error ? err.message : String(err)}`,
    })
    return { valid: false, issues }
  }

  // ── 3. BAR type is 'reflection' ─────────────────────────────────────
  if (barData.type !== 'reflection') {
    issues.push({
      code: 'BAR_TYPE_WRONG',
      message: `BAR type must be 'reflection', got '${barData.type}'.`,
      path: 'type',
    })
  }

  // ── 4. BAR nation matches suggestion channel ────────────────────────
  const expectedNation = suggestion.channel.toLowerCase()
  if (barData.nation !== expectedNation) {
    issues.push({
      code: 'BAR_NATION_MISMATCH',
      message: `BAR nation must be '${expectedNation}' for channel '${suggestion.channel}', got '${barData.nation}'.`,
      path: 'nation',
    })
  }

  // ── 5. emotionalAlchemyTag matches nation ───────────────────────────
  if (barData.emotionalAlchemyTag !== expectedNation) {
    issues.push({
      code: 'BAR_TAG_MISMATCH',
      message: `BAR emotionalAlchemyTag must match nation '${expectedNation}', got '${barData.emotionalAlchemyTag}'.`,
      path: 'emotionalAlchemyTag',
    })
  }

  // ── 6. Parse and validate strandMetadata ────────────────────────────
  let metadata: ReflectionBarMetadata
  try {
    metadata = JSON.parse(barData.strandMetadata)
  } catch {
    issues.push({
      code: 'BAR_METADATA_PARSE_FAILED',
      message: 'BAR strandMetadata is not valid JSON.',
      path: 'strandMetadata',
    })
    return { valid: false, issues }
  }

  // isEpiphany MUST be true — this is THE core invariant
  if (metadata.isEpiphany !== true) {
    issues.push({
      code: 'EPIPHANY_FLAG_MISSING',
      message: 'Reflection BAR strandMetadata.isEpiphany MUST be true. The Reflection BAR IS the epiphany.',
      path: 'strandMetadata.isEpiphany',
    })
  }

  // arcPhase must be 'reflection'
  if (metadata.arcPhase !== 'reflection') {
    issues.push({
      code: 'BAR_METADATA_PHASE_WRONG',
      message: `strandMetadata.arcPhase must be 'reflection', got '${metadata.arcPhase}'.`,
      path: 'strandMetadata.arcPhase',
    })
  }

  // alchemyEngine must be true
  if (metadata.alchemyEngine !== true) {
    issues.push({
      code: 'BAR_METADATA_ENGINE_FLAG',
      message: 'strandMetadata.alchemyEngine must be true.',
      path: 'strandMetadata.alchemyEngine',
    })
  }

  // Channel in metadata must match suggestion channel
  if (metadata.channel !== suggestion.channel) {
    issues.push({
      code: 'BAR_METADATA_CHANNEL_MISMATCH',
      message: `strandMetadata.channel must be '${suggestion.channel}', got '${metadata.channel}'.`,
      path: 'strandMetadata.channel',
    })
  }

  // ── 7. Regulation trajectory matches reflection phase ───────────────
  const expectedFrom = PHASE_REGULATION_MAP.reflection.from
  const expectedTo = PHASE_REGULATION_MAP.reflection.to
  if (metadata.regulation.from !== expectedFrom || metadata.regulation.to !== expectedTo) {
    issues.push({
      code: 'BAR_REGULATION_MISMATCH',
      message: `Reflection regulation must be ${expectedFrom}→${expectedTo}, got ${metadata.regulation.from}→${metadata.regulation.to}.`,
      path: 'strandMetadata.regulation',
    })
  }

  // ── 8. Content is substantive ───────────────────────────────────────
  if (!barData.description || barData.description.trim().length < MIN_BODY_LENGTH) {
    issues.push({
      code: 'BAR_CONTENT_TOO_SHORT',
      message: `BAR description must be at least ${MIN_BODY_LENGTH} characters, got ${barData.description?.trim().length ?? 0}.`,
      path: 'description',
    })
  }

  return { valid: issues.length === 0, issues }
}

// ---------------------------------------------------------------------------
// Full pipeline validation (suggestion set + BAR conformance)
// ---------------------------------------------------------------------------

/**
 * Validate an entire ReflectionCompletionSet for both structural correctness
 * AND BAR conformance of all 3 suggestions.
 *
 * This is the top-level validation function that should be called before
 * presenting suggestions to the player. It ensures:
 *   1. The completion set is structurally valid
 *   2. Each suggestion can produce a valid Reflection BAR
 *   3. All BAR artifacts will have isEpiphany: true
 *   4. Wuxing cycle compliance (when primaryChannel provided)
 *
 * @param set - The ReflectionCompletionSet to validate
 * @param primaryChannel - The player's arc channel (enables Wuxing validation)
 * @returns ValidationResult with all issues collected
 */
export function validateCompletionSetWithBarConformance(
  set: ReflectionCompletionSet,
  primaryChannel?: EmotionalChannel,
): ValidationResult {
  const issues: ValidationIssue[] = []

  // ── 1. Structural validation ────────────────────────────────────────
  const structuralResult = validateCompletionSet(set, primaryChannel)
  issues.push(...structuralResult.issues)

  // ── 2. BAR conformance for each suggestion ──────────────────────────
  for (let i = 0; i < set.suggestions.length; i++) {
    const barResult = validateSuggestionBarConformance(set.suggestions[i], {
      playerId: set.contextSummary.playerId,
      intakeBarId: set.contextSummary.intakeBarId,
      actionBarId: set.contextSummary.actionBarId,
    })
    for (const issue of barResult.issues) {
      issues.push({
        ...issue,
        path: `suggestions[${i}].bar.${issue.path ?? ''}`.replace(/\.$/, ''),
      })
    }
  }

  return { valid: issues.length === 0, issues }
}

// ---------------------------------------------------------------------------
// Guards and type narrowing
// ---------------------------------------------------------------------------

/**
 * Type guard: is this a valid EmotionalChannel?
 */
export function isValidChannel(value: unknown): value is EmotionalChannel {
  return typeof value === 'string' && VALID_CHANNELS.includes(value as EmotionalChannel)
}

/**
 * Type guard: is this a valid SuggestionKey?
 */
export function isValidSuggestionKey(value: unknown): value is SuggestionKey {
  return typeof value === 'string' && VALID_SUGGESTION_KEYS.includes(value as SuggestionKey)
}

/**
 * Type guard: is this a valid SuggestionFraming?
 */
export function isValidFraming(value: unknown): value is SuggestionFraming {
  return typeof value === 'string' && VALID_FRAMINGS.includes(value as SuggestionFraming)
}

/**
 * Assert a suggestion is valid, throwing if not.
 * Use in server actions where invalid input should be rejected immediately.
 */
export function assertValidSuggestion(
  suggestion: unknown,
  context?: string,
): asserts suggestion is ReflectionCompletionSuggestion {
  const result = validateSuggestion(suggestion)
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : ''
    const messages = result.issues.map((i) => `${i.code}: ${i.message}`).join('; ')
    throw new Error(`${prefix}Invalid ReflectionCompletionSuggestion: ${messages}`)
  }
}

/**
 * Assert a completion set is valid, throwing if not.
 * Use in server actions where invalid input should be rejected immediately.
 */
export function assertValidCompletionSet(
  set: unknown,
  primaryChannel?: EmotionalChannel,
  context?: string,
): asserts set is ReflectionCompletionSet {
  const result = validateCompletionSet(set, primaryChannel)
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : ''
    const messages = result.issues.map((i) => `${i.code}: ${i.message}`).join('; ')
    throw new Error(`${prefix}Invalid ReflectionCompletionSet: ${messages}`)
  }
}

// ---------------------------------------------------------------------------
// Sanitization — repair common AI output issues
// ---------------------------------------------------------------------------

/**
 * Attempt to sanitize an AI-generated suggestion by fixing common issues:
 *   - Trim whitespace from title/body/label
 *   - Truncate body if over MAX_BODY_LENGTH
 *   - Fix channel↔element mismatch by deriving element from channel
 *   - Fix key↔framing mismatch by deriving framing from key
 *
 * Returns the sanitized suggestion. Does NOT guarantee validity —
 * always validate after sanitizing.
 */
export function sanitizeSuggestion(
  raw: Partial<ReflectionCompletionSuggestion>,
): ReflectionCompletionSuggestion {
  const key = isValidSuggestionKey(raw.key) ? raw.key : 'channel_aligned'
  const channel = isValidChannel(raw.channel) ? raw.channel : 'Neutrality'

  return {
    key,
    label: (raw.label ?? '').trim().slice(0, MAX_LABEL_LENGTH) || `${CHANNEL_ELEMENT_MAP[channel]} Insight`,
    channel,
    element: CHANNEL_ELEMENT_MAP[channel], // always derive from channel
    title: (raw.title ?? '').trim().slice(0, MAX_TITLE_LENGTH) || `${channel} Epiphany`,
    body: (raw.body ?? '').trim().slice(0, MAX_BODY_LENGTH) || 'Reflection phase completed.',
    framing: KEY_FRAMING_MAP[key], // always derive from key
  }
}

// ---------------------------------------------------------------------------
// Convenience: validate + explain (human-readable summary)
// ---------------------------------------------------------------------------

/**
 * Validate and return a human-readable summary.
 * Useful for debugging and logging.
 */
export function explainValidation(result: ValidationResult): string {
  if (result.valid) {
    return 'Validation passed: all channel-typed BAR requirements and epiphany artifact structure confirmed.'
  }

  const lines = [`Validation failed with ${result.issues.length} issue(s):`]
  for (const issue of result.issues) {
    const pathStr = issue.path ? ` at ${issue.path}` : ''
    lines.push(`  [${issue.code}]${pathStr}: ${issue.message}`)
  }
  return lines.join('\n')
}
