/**
 * Campaign subcampaigns — domain-keyed children of top-level campaigns.
 * @see .specify/specs/campaign-subcampaigns/spec.md
 */

export const ALLYSHIP_DOMAINS = [
  'GATHERING_RESOURCES',
  'DIRECT_ACTION',
  'RAISE_AWARENESS',
  'SKILLFUL_ORGANIZING',
] as const

export type AllyshipDomain = (typeof ALLYSHIP_DOMAINS)[number]

/** Returns the three allyship domains excluding the parent's domain. */
export function getSubcampaignDomains(parentDomain: string): string[] {
  const normalized = parentDomain.toUpperCase().replace(/-/g, '_')
  return ALLYSHIP_DOMAINS.filter((d) => d !== normalized)
}

/** Build compound ref for subcampaign, or return campaignRef for top-level. */
export function getCampaignRef(
  campaignRef: string,
  subcampaignDomain?: string | null
): string {
  if (!subcampaignDomain?.trim()) return campaignRef
  return `${campaignRef}:${subcampaignDomain}`
}

/** Parse ref into campaignRef and optional subcampaignDomain. */
export function parseCampaignRef(ref: string): {
  campaignRef: string
  subcampaignDomain?: string
} {
  const colon = ref.indexOf(':')
  if (colon === -1) {
    return { campaignRef: ref }
  }
  return {
    campaignRef: ref.slice(0, colon),
    subcampaignDomain: ref.slice(colon + 1) || undefined,
  }
}

/** Check if domain is a valid allyship domain. */
export function isValidAllyshipDomain(domain: string): domain is AllyshipDomain {
  return ALLYSHIP_DOMAINS.includes(domain as AllyshipDomain)
}
