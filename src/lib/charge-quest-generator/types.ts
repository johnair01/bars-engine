/**
 * Charge → Quest Generator v0 — Type definitions
 * Spec: docs/architecture/charge-quest-generator-api.md
 */

export type MoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

export type EmotionChannel = 'anger' | 'joy' | 'sadness' | 'fear' | 'neutrality'

export interface QuestSuggestion {
  move_type: MoveType
  quest_title: string
  quest_summary: string
  template_id?: string
  confidence?: number
  rationale?: string
}

export interface ChargeBarInput {
  bar_id: string
  summary_text: string
  emotion_channel?: EmotionChannel | null
  intensity?: number | null
  context_note?: string | null
}
