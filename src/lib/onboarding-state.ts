/**
 * Onboarding state types and constants.
 * Used by onboarding actions and API routes.
 * See: .specify/specs/onboarding-flow-completion/spec.md
 */

/** Onboarding state enum (spec: onboarding-flow-completion) */
export type OnboardingState =
    | 'new_player'
    | 'campaign_intro'
    | 'identity_setup'
    | 'vector_declaration'
    | 'onboarding_complete'
    | 'starter_quests_generated'

export interface GetOnboardingStateResult {
    playerId: string
    onboardingState: OnboardingState
    nationId: string | null
    archetypeId: string | null
    campaignDomainPreference: string[] | null
    hasLens: boolean
}

/** Valid events for advanceOnboardingState */
export const ONBOARDING_ADVANCE_EVENTS = [
    'campaign_intro_viewed',
    'nation_selected',
    'archetype_selected',
    'developmental_lens_selected',
    'intended_impact_selected',
    'bar_created',
    'onboarding_completed',
    'starter_quests_generated',
] as const

export type OnboardingAdvanceEvent = (typeof ONBOARDING_ADVANCE_EVENTS)[number]

export interface AdvanceOnboardingStateResult {
    success: boolean
    onboardingState?: OnboardingState
    error?: string
}
