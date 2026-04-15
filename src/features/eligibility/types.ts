/**
 * Actor Capability + Quest Eligibility Engine v0 — Type definitions
 *
 * Spec: docs/architecture/actor-capability-quest-eligibility-engine.md
 * API: docs/architecture/quest-eligibility-api.md
 */

export type CapabilityType = 'role' | 'move' | 'support' | 'quest_action' | 'domain'
export type CapabilitySource = 'nation' | 'archetype' | 'quest_history' | 'permission' | 'agent_profile'

export interface ActorCapability {
  capability_id: string
  capability_type: CapabilityType
  source: CapabilitySource
  strength?: number | 'high' | 'medium' | 'low'
}

export interface ActorProfileInput {
  actor_id: string
  actor_type: 'player' | 'agent'
  nation?: string
  archetype?: string
  campaign_ids?: string[]
  active_roles?: string[]
  completed_quest_ids?: string[]
  capability_tags?: string[]
  unlocked_move_ids?: string[]
  campaign_domain_preference?: string[]
  availability?: 'available' | 'limited' | 'unavailable'
}

export interface QuestRequirement {
  quest_id: string
  required_capabilities?: string[]
  preferred_capabilities?: string[]
  required_campaign_membership?: string
  preferred_nations?: string[]
  preferred_archetypes?: string[]
  required_roles_open?: ('responsible' | 'accountable' | 'consulted' | 'informed')[]
  required_prior_quests?: string[]
  allyship_domain?: string
  move_type?: string
}

export type RaciRole = 'responsible' | 'accountable' | 'consulted' | 'informed'

export interface EligibilityResult {
  actor_id: string
  quest_id: string
  hard_eligible: boolean
  stewardship_eligible: boolean
  eligible_roles: RaciRole[]
  match_score: number
  match_reasons: string[]
  blocking_reasons?: string[]
}
