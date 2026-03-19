'use server'

import { db } from '@/lib/db'

const KOTTER_STAGE_NAMES: Record<number, string> = {
  1: 'Urgency',
  2: 'Coalition',
  3: 'Vision',
  4: 'Communicate',
  5: 'Obstacles',
  6: 'Wins',
  7: 'Build On',
  8: 'Anchor',
}

export type CampaignForPlayer = {
  id: string
  name: string
  slug: string
  campaignRef: string | null
  kotterStage: number
  nextMilestone: string
}

/**
 * Returns campaigns (instances) where the player is leader or owner.
 * Uses InstanceMembership.roleKey in ('owner','steward').
 * Limit to 2–3 to reduce overwhelm.
 */
export async function getCampaignsForPlayer(playerId: string): Promise<CampaignForPlayer[]> {
  try {
    const memberships = await db.instanceMembership.findMany({
      where: {
        playerId,
        roleKey: { in: ['owner', 'steward'] },
      },
      include: {
        instance: {
          select: {
            id: true,
            name: true,
            slug: true,
            campaignRef: true,
            kotterStage: true,
          },
        },
      },
      take: 3,
    })

    return memberships
      .filter((m) => m.instance)
      .map((m) => {
        const inst = m.instance!
        const stageName = KOTTER_STAGE_NAMES[inst.kotterStage] ?? `Stage ${inst.kotterStage}`
        return {
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          campaignRef: inst.campaignRef,
          kotterStage: inst.kotterStage,
          nextMilestone: stageName,
        }
      })
  } catch (e) {
    console.warn('[getCampaignsForPlayer]', e)
    return []
  }
}
