'use server'

/**
 * Spoke state for a spatial map room anchor.
 *
 * Used by the world room page to hydrate SpokePortalModal with
 * hexagram context + seed status per spoke before any UI renders.
 */

import { db } from '@/lib/db'
import {
  isCampaignHubStateV1,
  hubStateMatchesKotter,
} from '@/lib/campaign-hub/types'

export type SpokeState = {
  spokeIndex: number
  hexagramId: number | null
  /** GameMasterFace string or null */
  primaryFace: string | null
  seedBarId: string | null
  isLocked: boolean
}

/** Spoke indices with authored CYOA content. Mirrors AVAILABLE_SPOKE_INDICES in spoke page. */
const AVAILABLE_SPOKE_INDICES = [0, 1]

/**
 * Return per-spoke context for the 8 spoke_portal anchors in a campaign clearing room.
 * Reads hub draw from Instance.campaignHubState and planted seed BARs from CustomBar.
 */
export async function getSpokeStatesForRoom(
  campaignRef: string,
  playerId: string,
): Promise<SpokeState[]> {
  const [inst, seedBars] = await Promise.all([
    db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { kotterStage: true, campaignHubState: true },
    }),
    db.customBar.findMany({
      where: {
        creatorId: playerId,
        campaignRef,
        status: 'seed',
        agentMetadata: { contains: '"spokeIndex":' },
      },
      select: { id: true, agentMetadata: true },
    }),
  ])

  // Build spokeIndex → barId map from agentMetadata
  const seedBySpoke = new Map<number, string>()
  for (const bar of seedBars) {
    if (!bar.agentMetadata) continue
    try {
      const meta = JSON.parse(bar.agentMetadata) as { spokeIndex?: unknown }
      if (typeof meta.spokeIndex === 'number') {
        seedBySpoke.set(meta.spokeIndex, bar.id)
      }
    } catch {
      // ignore malformed metadata
    }
  }

  const ks = inst?.kotterStage ?? 1
  const hubState = inst?.campaignHubState

  return Array.from({ length: 8 }, (_, i) => {
    let hexagramId: number | null = null
    let primaryFace: string | null = null

    if (
      isCampaignHubStateV1(hubState) &&
      hubStateMatchesKotter(hubState, ks)
    ) {
      const draw = hubState.spokes[i]
      hexagramId = draw?.hexagramId ?? null
      primaryFace = draw?.primaryFace ?? null
    }

    return {
      spokeIndex: i,
      hexagramId,
      primaryFace,
      seedBarId: seedBySpoke.get(i) ?? null,
      isLocked: !AVAILABLE_SPOKE_INDICES.includes(i),
    }
  })
}
