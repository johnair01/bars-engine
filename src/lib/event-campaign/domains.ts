/**
 * Event Campaign — Canonical Domain Validation
 *
 * Exactly four canonical domains. Topic is flexible; domain is fixed.
 * Spec: .specify/specs/event-campaign-engine/spec.md
 */

export const EVENT_CAMPAIGN_DOMAINS = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
] as const

export type EventCampaignDomain = (typeof EVENT_CAMPAIGN_DOMAINS)[number]

export const EVENT_PRODUCTION_GRAMMARS = ['kotter', 'epiphany_bridge'] as const

export type EventProductionGrammar = (typeof EVENT_PRODUCTION_GRAMMARS)[number]

/**
 * Validate primary domain. Only canonical four allowed.
 */
export function validatePrimaryDomain(value: string): value is EventCampaignDomain {
  return EVENT_CAMPAIGN_DOMAINS.includes(value as EventCampaignDomain)
}

/**
 * Validate secondary domain (optional; same as primary when set).
 */
export function validateSecondaryDomain(value: string | null | undefined): value is EventCampaignDomain | null {
  if (value == null || value === '') return true
  return validatePrimaryDomain(value)
}

/**
 * Validate production grammar.
 */
export function validateProductionGrammar(value: string): value is EventProductionGrammar {
  return EVENT_PRODUCTION_GRAMMARS.includes(value as EventProductionGrammar)
}

/**
 * Assert primary domain or throw.
 */
export function assertPrimaryDomain(value: string): asserts value is EventCampaignDomain {
  if (!validatePrimaryDomain(value)) {
    throw new Error(
      `Invalid primary domain: ${value}. Must be one of: ${EVENT_CAMPAIGN_DOMAINS.join(', ')}`
    )
  }
}

/**
 * Assert production grammar or throw.
 */
export function assertProductionGrammar(value: string): asserts value is EventProductionGrammar {
  if (!validateProductionGrammar(value)) {
    throw new Error(
      `Invalid production grammar: ${value}. Must be one of: ${EVENT_PRODUCTION_GRAMMARS.join(', ')}`
    )
  }
}
