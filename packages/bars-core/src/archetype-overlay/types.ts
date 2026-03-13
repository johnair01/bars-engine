/**
 * Archetype Influence Overlay v1 — Type definitions
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

export interface ArchetypeInfluenceProfile {
  archetype_id: string
  archetype_name: string
  trigram: string
  agency_pattern: string[]
  action_style: string[]
  reflection_style: string[]
  integration_style: string[]
  prompt_modifiers: string[]
  quest_style_modifiers: string[]
}
