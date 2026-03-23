/**
 * Charge → Quest Generator v0 — Template-based quest suggestion
 * Spec: docs/architecture/charge-quest-generator.md
 *
 * Deterministic, template-based. Emotion channel influences move ordering.
 */

import { QUEST_TEMPLATES, extractTopic } from './templates'
import type { ChargeBarInput, QuestSuggestion, EmotionChannel } from './types'

/** Emotion → preferred move order (first = highest bias) */
const EMOTION_MOVE_BIAS: Record<EmotionChannel, string[]> = {
  anger: ['clean_up', 'wake_up', 'grow_up', 'show_up'],
  joy: ['show_up', 'grow_up', 'wake_up', 'clean_up'],
  sadness: ['clean_up', 'wake_up', 'grow_up', 'show_up'],
  fear: ['grow_up', 'wake_up', 'clean_up', 'show_up'],
  neutrality: ['show_up', 'wake_up', 'grow_up', 'clean_up'],
}

/** Relational keywords → prefer clean_up first */
const RELATIONAL_KEYWORDS = [
  'colleague', 'friend', 'partner', 'family', 'boss', 'team', 'relationship',
  'conflict', 'argument', 'tension', 'angry at', 'frustrated with',
]

function hasRelationalContext(summary: string): boolean {
  const lower = summary.toLowerCase()
  return RELATIONAL_KEYWORDS.some((kw) => lower.includes(kw))
}

function applyTemplate(
  template: (typeof QUEST_TEMPLATES)[0],
  topic: string
): { title: string; summary: string } {
  return {
    title: template.title_template.replace(/\{topic\}/g, topic),
    summary: template.summary_template.replace(/\{topic\}/g, topic),
  }
}

/**
 * Generate 3–4 quest suggestions from a charge BAR.
 * Deterministic: same input → same output.
 */
export function generateQuestSuggestions(input: ChargeBarInput): QuestSuggestion[] {
  const topic = extractTopic(input.summary_text)
  const emotion = input.emotion_channel ?? 'neutrality'
  const intensity = input.intensity ?? 3
  const isRelational = hasRelationalContext(input.summary_text)

  // When relational + high intensity anger/sadness, prioritize clean_up
  let moveOrder = EMOTION_MOVE_BIAS[emotion]
  if (isRelational && (emotion === 'anger' || emotion === 'sadness') && intensity >= 4) {
    moveOrder = ['clean_up', 'wake_up', 'grow_up', 'show_up']
  }

  // Player's committed move takes priority — put it first, others follow in original order
  if (input.declared_move) {
    const declared = input.declared_move
    moveOrder = [declared, ...moveOrder.filter((m) => m !== declared)]
  }

  const seenMoves = new Set<string>()
  const suggestions: QuestSuggestion[] = []

  for (const moveType of moveOrder) {
    if (seenMoves.has(moveType)) continue

    const candidates = QUEST_TEMPLATES.filter((t) => t.move_type === moveType)
    if (candidates.length === 0) continue

    // Prefer template with emotion bias
    const preferred = candidates.find((t) => t.emotion_bias?.includes(emotion)) ?? candidates[0]
    const { title, summary } = applyTemplate(preferred, topic)

    const confidence = 0.5 + (preferred.emotion_bias?.includes(emotion) ? 0.2 : 0) + (intensity >= 4 ? 0.1 : 0)
    const rationale =
      moveType === 'clean_up' && isRelational
        ? 'Relational charge benefits from processing first'
        : preferred.emotion_bias?.includes(emotion)
          ? `${emotion} often aligns with ${moveType.replace('_', ' ')}`
          : undefined

    suggestions.push({
      move_type: moveType as QuestSuggestion['move_type'],
      quest_title: title,
      quest_summary: summary,
      template_id: preferred.template_id,
      confidence: Math.min(0.95, confidence),
      rationale,
    })
    seenMoves.add(moveType)

    if (suggestions.length >= 4) break
  }

  return suggestions
}
