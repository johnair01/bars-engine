/**
 * Charge → Quest Generator v0 — Quest templates
 * Spec: docs/architecture/charge-quest-generator.md
 *
 * Templates use {topic} placeholder. Topic is extracted from charge summary.
 */

import type { MoveType } from './types'

export interface QuestTemplate {
  template_id: string
  move_type: MoveType
  title_template: string
  summary_template: string
  /** Emotion channels that bias toward this template (optional) */
  emotion_bias?: string[]
}

/** Extract a short topic phrase from charge summary for template substitution */
export function extractTopic(summary: string): string {
  const s = summary.trim()
  if (!s) return 'this'
  // Strip common prefixes (multiple passes for compound phrases)
  let stripped = s
    .replace(/^(i'm|i am|i feel|feeling|felt)\s+/i, '')
    .replace(/^(frustrated about|angry about|sad about|excited about|inspired to|worried about|anxious about)\s+/i, '')
    .trim()
  if (!stripped) return s.slice(0, 40)
  return stripped.length > 50 ? stripped.slice(0, 47) + '...' : stripped
}

/** Generic templates that work for most topics */
export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    template_id: 'research_exploration',
    move_type: 'wake_up',
    title_template: 'Learn how {topic} works in your context',
    summary_template: 'Spend 30 minutes researching and mapping what you notice about {topic}.',
    emotion_bias: ['anger', 'fear'],
  },
  {
    template_id: 'reflection_process',
    move_type: 'clean_up',
    title_template: 'Run a 3-2-1 reflection on {topic}',
    summary_template: 'Use the 3-2-1 process to process the emotional charge before taking action.',
    emotion_bias: ['anger', 'sadness'],
  },
  {
    template_id: 'skill_practice',
    move_type: 'grow_up',
    title_template: 'Practice one courageous step with {topic}',
    summary_template: 'Choose one small action you can take in the next 24 hours related to {topic}.',
    emotion_bias: ['fear', 'joy'],
  },
  {
    template_id: 'conversation_invitation',
    move_type: 'show_up',
    title_template: 'Invite people into a conversation about {topic}',
    summary_template: 'Host a small discussion or reach out to one person about {topic}.',
    emotion_bias: ['joy', 'neutrality'],
  },
  {
    template_id: 'mapping_quest',
    move_type: 'wake_up',
    title_template: 'Map what you notice about {topic}',
    summary_template: 'Spend 10 minutes writing what you observe without judgment.',
    emotion_bias: ['fear', 'sadness'],
  },
  {
    template_id: 'event_hosting',
    move_type: 'show_up',
    title_template: 'Organize a small gathering around {topic}',
    summary_template: 'Invite 2–3 people to spend time together on {topic}.',
    emotion_bias: ['joy', 'neutrality'],
  },
]
