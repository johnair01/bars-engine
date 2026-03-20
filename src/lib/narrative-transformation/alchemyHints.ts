/**
 * Alchemy + 321-facing hints from parsed narrative (thin wrappers only).
 * Spec: .specify/specs/narrative-transformation-engine/tasks.md Phase 3
 *
 * - Emotion channel: registry `EmotionChannel` (no parallel taxonomy).
 * - Movement hint: `deriveMovementPerNode` from emotional-alchemy ontology.
 * - 321: simple person-shift strings for optional shadow pathway UI (not a full 321 session).
 */

import type { EmotionChannel } from '@/lib/transformation-move-registry/types'
import type { ParsedNarrative } from '@/lib/transformation-move-registry/types'
import { deriveMovementPerNode } from '@/lib/quest-grammar/emotional-alchemy'
import type { MovementType } from '@/lib/quest-grammar/types'

export type Shadow321PromptTriad = {
  third_person: string
  second_person: string
  first_person: string
}

export type NarrativeTransformationHints = {
  emotion_channel: EmotionChannel
  /** Default 6-beat Epiphany-style movement arc from unpacking-style inputs */
  movement_per_node: MovementType[]
  prompts_321: Shadow321PromptTriad
}

const FEAR_RE = /\b(afraid|fear|fears|scared|scary|anxious|anxiety|worr(y|ied)|panic|dread)\b/i
const ANGER_RE = /\b(angry|anger|rage|furious|resent|bitter|irritat)\b/i
const SAD_RE = /\b(sad|sadness|grief|ashamed|shame|hopeless|depress|hurt|lonely)\b/i
const JOY_RE = /\b(joy|grateful|gratitude|relief|hopeful)\b/i

/**
 * Map free text to registry emotion channel (heuristic; default neutrality).
 */
export function inferEmotionChannel(text: string): EmotionChannel {
  const t = text.toLowerCase()
  if (FEAR_RE.test(t)) return 'fear'
  if (ANGER_RE.test(t)) return 'anger'
  if (SAD_RE.test(t)) return 'sadness'
  if (JOY_RE.test(t)) return 'joy'
  return 'neutrality'
}

/**
 * Build hints for UIs that already understand Emotional Alchemy + 321-style person shifts.
 */
export function buildTransformationHints(narrative: ParsedNarrative): NarrativeTransformationHints {
  const blob = [narrative.raw_text, narrative.state, narrative.object].filter(Boolean).join(' ')
  const emotion_channel = inferEmotionChannel(blob)

  const dissatisfied = narrative.state?.trim() ? narrative.state.trim() : narrative.raw_text.slice(0, 200)
  const shadowBlob = narrative.negations?.length ? narrative.negations.join(' ') : ''
  const movement_per_node = deriveMovementPerNode([], dissatisfied, shadowBlob || narrative.raw_text, 6)

  const actor = narrative.actor?.trim() || 'I'
  const state = narrative.state?.trim() || 'this tension'
  const object = narrative.object?.trim() || 'the situation'

  const prompts_321: Shadow321PromptTriad = {
    third_person: `${actor} is holding "${state}" regarding ${object}. What do you notice from the outside?`,
    second_person: `You sense "${state}" when ${object} is present. What wants a little room?`,
    first_person: `I acknowledge "${state}" about ${object}. What is one honest sentence I can stand behind?`,
  }

  return { emotion_channel, movement_per_node, prompts_321 }
}
