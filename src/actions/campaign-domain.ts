'use server'

import { db } from '@/lib/db'
import { resolveDomainSource, type DomainResolution } from '@/lib/quest-grammar/domain-source'

/**
 * What a quest-building form should open with for a campaign (by slug): its domain pre-selected,
 * or nothing selected and a pick required when the campaign is missing or has no domain.
 */
export async function getCampaignDomainResolution(campaignRef: string | null | undefined): Promise<DomainResolution> {
  const row = campaignRef
    ? await db.campaign.findFirst({ where: { slug: campaignRef }, select: { id: true, allyshipDomain: true } })
    : null
  return resolveDomainSource(row?.id, row?.allyshipDomain)
}
