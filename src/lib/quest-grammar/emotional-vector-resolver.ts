/**
 * Emotional Vector Resolver
 * Shaman face — bridges authored content to EmotionalVector
 *
 * Resolves the semantic meaning of a BAR's emotionalVector:
 * "What emotional state does this BAR produce in players?"
 *
 * Owned by Shaman. Interpretation A only (BAR tagging at creation).
 * See: COUNCIL/logs/shaman-2026-04-22.md — hexagram #54 consult.
 */

import type { EmotionalVector, EmotionalChannel } from './types'
import type { AlchemyAltitude } from '../alchemy/types'
import { parseVectorString } from './types'

// ---------------------------------------------------------------------------
// Keyword → Channel mappings
// ---------------------------------------------------------------------------

const CHANNEL_KEYWORDS: Record<string, EmotionalChannel> = {
  // Fear
  fear: 'Fear', afraid: 'Fear', anxiety: 'Fear', anxious: 'Fear',
  scared: 'Fear', frightened: 'Fear', terrified: 'Fear',
  dread: 'Fear', worried: 'Fear', worry: 'Fear', nervous: 'Fear',
  // Anger
  anger: 'Anger', angry: 'Anger', frustration: 'Anger', frustrated: 'Anger',
  rage: 'Anger', fury: 'Anger', irritation: 'Anger', annoyed: 'Anger',
  resentment: 'Anger', bitterness: 'Anger', hostile: 'Anger',
  // Sadness
  sadness: 'Sadness', sad: 'Sadness', grief: 'Sadness', mourn: 'Sadness',
  sorrow: 'Sadness', loss: 'Sadness', lonely: 'Sadness', loneliness: 'Sadness',
  heartbreak: 'Sadness', hurting: 'Sadness', hurt: 'Sadness',
  // Joy
  joy: 'Joy', happy: 'Joy', happiness: 'Joy', delight: 'Joy',
  bliss: 'Joy', pleasure: 'Joy', excitement: 'Joy', excited: 'Joy',
  wonder: 'Joy', awe: 'Joy', love: 'Joy',
  gratitude: 'Joy', thankfulness: 'Joy',
  // Neutrality
  neutrality: 'Neutrality', numb: 'Neutrality', numbness: 'Neutrality',
  empty: 'Neutrality', void: 'Neutrality', stillness: 'Neutrality',
  peace: 'Neutrality', calm: 'Neutrality', presence: 'Neutrality',
}

/** Keywords that indicate altitude "dissatisfied" */
const DISSATISFIED_KEYWORDS = [
  'confused', 'overwhelmed', 'lost', 'stuck', 'blocked',
  'anxious', 'worried', 'afraid', 'angry', 'sad',
  'frustrated', 'stranded', 'alone', 'broken',
]

/** Keywords that indicate altitude "satisfied" */
const SATISFIED_KEYWORDS = [
  'clarity', 'resolution', 'breakthrough', 'understanding',
  'peace', 'connection', 'flow', 'ease',
  'joy', 'excitement', 'bliss', 'gratitude',
  'courage', 'bravery', 'acceptance',
]

// ---------------------------------------------------------------------------
// BarType → Default vector patterns
// ---------------------------------------------------------------------------

/**
 * Default emotional vector by barType.
 * These patterns reflect the emotional arc each type is designed to produce.
 */
const BAR_TYPE_DEFAULTS: Record<string, Pick<EmotionalVector, 'channelFrom' | 'altitudeFrom' | 'channelTo' | 'altitudeTo'>> = {
  vibe: {
    channelFrom: 'Joy',
    altitudeFrom: 'neutral',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  },
  story: {
    channelFrom: 'Fear',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  },
  insight: {
    channelFrom: 'Neutrality',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Neutrality',
    altitudeTo: 'satisfied',
  },
}

// ---------------------------------------------------------------------------
// Mood string → EmotionalVector
// ---------------------------------------------------------------------------

/**
 * Parse a mood string (e.g. "fear:dissatisfied") into an EmotionalVector.
 */
export function parseMoodToVector(mood: string | null | undefined): EmotionalVector | null {
  if (!mood) return null
  return parseVectorString(mood)
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

export interface ResolverInput {
  title: string
  description: string
  barType: string
  /** Mood field from NL output (optional) */
  mood?: string | null
}

/**
 * Resolve an EmotionalVector from authored content + NL output.
 *
 * Resolution order:
 * 1. If mood parses as a valid vector string, use it directly
 * 2. Otherwise, derive from barType default + keyword analysis of title/description
 *
 * @returns EmotionalVector or null if insufficient signal
 */
export function resolveEmotionalVector(input: ResolverInput): EmotionalVector {
  // 1. Mood override — NL output can specify a mood directly
  const moodVector = parseMoodToVector(input.mood)
  if (moodVector) return moodVector

  // 2. Start from barType default
  const barTypeKey = (input.barType ?? 'story').toLowerCase()
  const default_ =
    BAR_TYPE_DEFAULTS[barTypeKey] ?? BAR_TYPE_DEFAULTS['story']

  // 3. Keyword analysis of title + description
  const combined = `${input.title} ${input.description}`.toLowerCase()

  // Detect channels from keywords
  const channels = detectChannels(combined)
  const channelFrom = channels[0] ?? default_.channelFrom
  const channelTo = channels[1] ?? channelFrom

  // Detect altitudes from keywords
  const altitudeFrom = detectDissatisfied(combined)
    ? 'dissatisfied'
    : default_.altitudeFrom
  const altitudeTo = detectSatisfied(combined)
    ? 'satisfied'
    : default_.altitudeTo

  // If altitudeFrom is satisfied, step back to neutral (can't start from satisfaction)
  const resolvedAltitudeFrom: AlchemyAltitude =
    altitudeFrom === 'satisfied' ? 'neutral' : altitudeFrom

  return {
    channelFrom,
    altitudeFrom: resolvedAltitudeFrom,
    channelTo,
    altitudeTo,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function detectChannels(text: string): EmotionalChannel[] {
  const found: EmotionalChannel[] = []
  for (const [keyword, channel] of Object.entries(CHANNEL_KEYWORDS)) {
    if (text.includes(keyword)) {
      found.push(channel)
      if (found.length >= 2) break
    }
  }
  // Dedupe
  return [...new Set(found)]
}

function detectDissatisfied(text: string): boolean {
  return DISSATISFIED_KEYWORDS.some(k => text.includes(k))
}

function detectSatisfied(text: string): boolean {
  return SATISFIED_KEYWORDS.some(k => text.includes(k))
}
