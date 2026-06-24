/**
 * Archetype Influence Overlay v1 — Type definitions
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

export interface ArchetypeInfluenceProfile {
  archetype_id: string
  archetype_name: string
  trigram: string
  inner_expression?: string
  outer_expression?: string
  developmental_spectrum?: {
    young_forming: string
    developed_full: string
  }
  hexagram_position?: {
    when_upper: string
    when_lower: string
  }
  natural_opposition?: {
    trigram: string
    archetype_name: string
  }
  agency_pattern: string[]
  action_style: string[]
  reflection_style: string[]
  integration_style: string[]
  prompt_modifiers: string[]
  quest_style_modifiers: string[]
}
