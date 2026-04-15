/**
 * Maps campaign references to their primary allyship domain.
 * Used for book summary domain-fit analysis: given a campaign's focus,
 * analyze how a book fits across all four domains.
 *
 * @see src/lib/allyship-domains.ts
 * @see .specify/memory/allyship-domain-definitions.md
 */
export const CAMPAIGN_PRIMARY_DOMAIN: Record<string, string> = {
  'bruised-banana': 'GATHERING_RESOURCES', // Residency fundraiser
}

export type AllyshipDomainKey =
  | 'GATHERING_RESOURCES'
  | 'DIRECT_ACTION'
  | 'RAISE_AWARENESS'
  | 'SKILLFUL_ORGANIZING'

export const ALLYSHIP_DOMAIN_LABELS: Record<AllyshipDomainKey, string> = {
  GATHERING_RESOURCES: 'Gathering Resources',
  DIRECT_ACTION: 'Direct Action',
  RAISE_AWARENESS: 'Raising Awareness',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
}

export function getCampaignPrimaryDomain(campaignRef: string): AllyshipDomainKey | null {
  const key = CAMPAIGN_PRIMARY_DOMAIN[campaignRef]
  return (key as AllyshipDomainKey) ?? null
}
