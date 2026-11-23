/**
 * Where a quest's domain comes from. A domain is carried from a source (the quest's single
 * campaign) or picked by a person; it is never defaulted. A campaign whose domain is empty
 * counts as nothing to carry, exactly like no campaign: the build waits for a pick.
 */
import { ALLYSHIP_DOMAINS, type AllyshipDomainKey } from '@/lib/allyship-domains'

export type DomainSource = 'campaign' | 'user_pick'

export interface DomainResolution {
  /** Domain to pre-select; null only when there is nothing to carry. */
  preselectedDomain: AllyshipDomainKey | null
  /** True when a person must pick one of the four before the quest can be built. */
  requiresPick: boolean
  /** Where the pre-selected domain came from; null when nothing is carried. */
  domainSource: DomainSource | null
  /** All four domains, always reachable. */
  availableDomains: readonly AllyshipDomainKey[]
}

const AVAILABLE: readonly AllyshipDomainKey[] = ALLYSHIP_DOMAINS.map((d) => d.key)

export function isDomainKey(value: unknown): value is AllyshipDomainKey {
  return typeof value === 'string' && (AVAILABLE as readonly string[]).includes(value)
}

/**
 * campaignId absent, or campaignDomain (Campaign.allyshipDomain) empty/null/unrecognised,
 * both yield requiresPick=true with nothing pre-selected. Never refuses, never substitutes a default.
 */
export function resolveDomainSource(
  campaignId: string | null | undefined,
  campaignDomain: string | null | undefined
): DomainResolution {
  const carried =
    campaignId && typeof campaignDomain === 'string' && isDomainKey(campaignDomain.trim())
      ? (campaignDomain.trim() as AllyshipDomainKey)
      : null
  if (carried) {
    return { preselectedDomain: carried, requiresPick: false, domainSource: 'campaign', availableDomains: AVAILABLE }
  }
  return { preselectedDomain: null, requiresPick: true, domainSource: null, availableDomains: AVAILABLE }
}

export type SettledDomain =
  | { ok: true; chosenDomain: AllyshipDomainKey; domainSource: DomainSource }
  | { ok: false; requiresPick: true; availableDomains: readonly AllyshipDomainKey[] }

/**
 * A person's pick wins, as a deliberate override of what the campaign carries; otherwise the
 * campaign's domain is carried; otherwise the build stops and asks for a pick.
 */
export function settleDomain(resolution: DomainResolution, picked?: string | null): SettledDomain {
  if (isDomainKey(picked)) {
    const domainSource =
      picked === resolution.preselectedDomain && resolution.domainSource ? resolution.domainSource : 'user_pick'
    return { ok: true, chosenDomain: picked, domainSource }
  }
  if (resolution.preselectedDomain && resolution.domainSource) {
    return { ok: true, chosenDomain: resolution.preselectedDomain, domainSource: resolution.domainSource }
  }
  return { ok: false, requiresPick: true, availableDomains: resolution.availableDomains }
}

/** Error text a server action returns when it stops for a pick. */
export const DOMAIN_PICK_REQUIRED =
  'Pick a domain: this quest has no campaign domain to carry. Choose Gathering Resources, Direct Action, Raise Awareness or Skillful Organizing.'
