/**
 * Transformation Move Registry v0 — Type definitions
 * Spec: .specify/specs/transformation-move-registry/spec.md
 */

export type WcgsStage = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

export type MoveCategory =
  | 'awareness'
  | 'reframing'
  | 'emotional_processing'
  | 'behavioral_experiment'
  | 'integration'

export type TypicalOutputType =
  | 'reflection'
  | 'dialogue'
  | 'somatic'
  | 'action'
  | 'integration'

export type LockType =
  | 'identity_lock'
  | 'emotional_lock'
  | 'action_lock'
  | 'possibility_lock'

export type EmotionChannel = 'fear' | 'anger' | 'sadness' | 'neutrality' | 'joy'

export type QuestStage = 'reflection' | 'cleanup' | 'growth' | 'action' | 'completion'

export interface PromptTemplate {
  template_id: string
  template_text: string
  template_type: TypicalOutputType
}

export interface BarIntegration {
  creates_bar: boolean
  bar_timing?: 'pre_action' | 'post_action' | 'completion'
  bar_type?: 'insight' | 'vibe'
  bar_prompt_template?: string
  optional_tracking_bar?: boolean
}

export interface QuestUsage {
  quest_stage: QuestStage
  is_required_for_full_arc: boolean
  can_stand_alone: boolean
  suggested_follow_up_moves: string[]
}

export interface TransformationMove {
  move_id: string
  move_name: string
  move_category: MoveCategory
  wcgs_stage: WcgsStage
  description: string
  purpose: string
  prompt_templates: PromptTemplate[]
  target_effect: string
  typical_output_type: TypicalOutputType
  compatible_lock_types: LockType[]
  compatible_emotion_channels: EmotionChannel[]
  compatible_nations: string[]
  compatible_archetypes: string[]
  bar_integration: BarIntegration
  quest_usage: QuestUsage
  safety_notes: string[]
}

export interface ParsedNarrative {
  raw_text: string
  actor: string
  state: string
  object: string
  negations?: string[]
  confidence?: number
}

export interface QuestSeedArc {
  wake?: { move_id: string; prompt: string; output_type: TypicalOutputType }
  clean?: { move_id: string; prompt: string; output_type: TypicalOutputType }
  grow?: { move_id: string; prompt: string; output_type: TypicalOutputType }
  show?: { move_id: string; prompt: string; output_type: TypicalOutputType }
  integrate?: { move_id: string; bar_prompt: string; bar_type: string }
}

export interface QuestSeed {
  quest_seed_id: string
  source_narrative: string
  lock_type: LockType
  arc: QuestSeedArc
}
