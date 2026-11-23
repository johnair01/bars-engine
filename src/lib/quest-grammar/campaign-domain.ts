/**
 * Server-side: carry a domain from the quest's single campaign (Campaign.allyshipDomain), or
 * use the person's pick, or stop for a pick. See domain-source.ts for the pure rules.
 */
import { db } from '@/lib/db'
import { resolveDomainSource, settleDomain, type SettledDomain } from './domain-source'

/** Look up the campaign by id, else by slug (campaignRef). */
export async function settleCampaignDomain(
  campaign: { campaignRef?: string | null; campaignId?: string | null },
  picked?: string | null
): Promise<SettledDomain> {
  const where = campaign.campaignId
    ? { id: campaign.campaignId }
    : campaign.campaignRef
      ? { slug: campaign.campaignRef }
      : null
  const row = where
    ? await db.campaign.findFirst({ where, select: { id: true, allyshipDomain: true } })
    : null
  return settleDomain(resolveDomainSource(row?.id, row?.allyshipDomain), picked)
}
