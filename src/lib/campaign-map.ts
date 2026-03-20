/**
 * Campaign Map — situational awareness for /campaign/board (Phase 1: Opening Momentum).
 * See .specify/specs/campaign-map-phase-1/spec.md
 */

import { db } from '@/lib/db'
import type { AllyshipDomain } from '@/lib/kotter'
import { getCampaignDeckQuestIds } from '@/lib/gameboard'
import {
  CAMPAIGN_MAP_DOMAINS,
  CAMPAIGN_MAP_DOMAIN_LABEL,
  CAMPAIGN_MAP_PHASE_1_DESCRIPTION,
  CAMPAIGN_MAP_PHASE_1_LABEL,
  computeEmergentFieldHint,
  defaultAllyshipDomainForQuest,
  type CampaignPhaseHeader,
  type DomainRegionCount,
  type FieldActivityIndicators,
} from '@/lib/campaign-map-shared'

export {
  CAMPAIGN_MAP_DOMAINS,
  CAMPAIGN_MAP_DOMAIN_LABEL,
  CAMPAIGN_MAP_PHASE_1_DESCRIPTION,
  CAMPAIGN_MAP_PHASE_1_LABEL,
  computeEmergentFieldHint,
  defaultAllyshipDomainForQuest,
  type CampaignPhaseHeader,
  type DomainRegionCount,
  type FieldActivityIndicators,
} from '@/lib/campaign-map-shared'

export async function getCampaignPhaseHeader(campaignRef: string): Promise<CampaignPhaseHeader> {
  const inst = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    orderBy: { updatedAt: 'desc' },
    select: { name: true },
  })
  const campaignName =
    inst?.name ??
    campaignRef
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  return {
    campaignName,
    phase: CAMPAIGN_MAP_PHASE_1_LABEL,
    phaseDescription: CAMPAIGN_MAP_PHASE_1_DESCRIPTION,
  }
}

/**
 * Aggregate quest + participation counts per allyship domain for the campaign deck.
 * Active players = distinct players with an incomplete PlayerQuest on a deck quest in that domain.
 */
export async function getDomainRegionCounts(
  campaignRef: string,
  period: number
): Promise<DomainRegionCount[]> {
  const deckIds = await getCampaignDeckQuestIds(campaignRef, period)
  if (deckIds.length === 0) {
    return CAMPAIGN_MAP_DOMAINS.map((domain) => ({
      domain,
      label: CAMPAIGN_MAP_DOMAIN_LABEL[domain],
      questCount: 0,
      activePlayerCount: 0,
    }))
  }

  const bars = await db.customBar.findMany({
    where: { id: { in: deckIds } },
    select: { id: true, allyshipDomain: true },
  })

  const byDomain = new Map<AllyshipDomain, string[]>()
  for (const d of CAMPAIGN_MAP_DOMAINS) byDomain.set(d, [])

  for (const b of bars) {
    const dom = defaultAllyshipDomainForQuest(b.allyshipDomain)
    byDomain.get(dom)!.push(b.id)
  }

  const result: DomainRegionCount[] = []
  for (const domain of CAMPAIGN_MAP_DOMAINS) {
    const questIds = byDomain.get(domain) ?? []
    const questCount = questIds.length

    let activePlayerCount = 0
    if (questIds.length > 0) {
      const grouped = await db.playerQuest.groupBy({
        by: ['playerId'],
        where: {
          questId: { in: questIds },
          completedAt: null,
        },
      })
      activePlayerCount = grouped.length
    }

    result.push({
      domain,
      label: CAMPAIGN_MAP_DOMAIN_LABEL[domain],
      questCount,
      activePlayerCount,
    })
  }

  return result
}

/**
 * Observational field metrics — read-only; does not gate gameplay.
 * Completions = PlayerQuest rows completed in the last 30 days for this campaignRef.
 */
export async function getFieldActivityIndicators(campaignRef: string): Promise<FieldActivityIndicators> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [barCount, completionCount, activePQ, inst] = await Promise.all([
    db.customBar.count({
      where: {
        campaignRef,
        status: 'active',
      },
    }),
    db.playerQuest.count({
      where: {
        completedAt: { gte: since },
        quest: { campaignRef },
      },
    }),
    db.playerQuest.findMany({
      where: {
        quest: { campaignRef },
        OR: [{ completedAt: null }, { completedAt: { gte: since } }],
      },
      distinct: ['playerId'],
      select: { playerId: true },
    }),
    db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      orderBy: { updatedAt: 'desc' },
      select: { goalAmountCents: true, currentAmountCents: true },
    }),
  ])

  let fundingProgress: number | undefined
  if (inst?.goalAmountCents != null && inst.goalAmountCents > 0) {
    fundingProgress = Math.min(1, (inst.currentAmountCents ?? 0) / inst.goalAmountCents)
  }

  const activePlayerCount = activePQ.length
  const emergentHint = computeEmergentFieldHint({
    barCount,
    completionCount,
    activePlayerCount,
  })

  return {
    barCount,
    completionCount,
    activePlayerCount,
    fundingProgress,
    emergentHint,
  }
}
