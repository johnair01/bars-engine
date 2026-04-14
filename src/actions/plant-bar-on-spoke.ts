'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { nurseryTypeToWcgs, type WcgsStage } from '@/lib/nation/move-library-accessor'
import {
  isCampaignHubStateV1,
  type CampaignHubStateV1,
  type CompletedBuildReceipt,
} from '@/lib/campaign-hub/types'

/** Map WCGS stage to SpokeMoveBed moveType. */
function wcgsToMoveType(stage: WcgsStage): string {
  const map: Record<WcgsStage, string> = {
    wake_up: 'wakeUp', clean_up: 'cleanUp', grow_up: 'growUp', show_up: 'showUp',
  }
  return map[stage]
}

/**
 * Plant a BAR on a spoke move bed. Called when the player carries a BAR
 * from an NPC ritual to a nursery room and chooses to plant it.
 */
export async function plantBarOnSpoke(input: {
  barId: string
  instanceSlug: string
  spokeIndex: number
  nurseryType: string
}): Promise<{ success: true; planted: boolean } | { success: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  // Resolve instance + campaign
  const instance = await dbBase.instance.findFirst({
    where: { slug: input.instanceSlug },
    select: { id: true, campaignRef: true, campaignHubState: true },
  })
  if (!instance) return { success: false, error: 'Instance not found' }
  const campaignRef = instance.campaignRef ?? input.instanceSlug

  // Verify BAR exists and belongs to player
  const bar = await dbBase.customBar.findUnique({
    where: { id: input.barId },
    select: { id: true, title: true, creatorId: true, type: true, gameMasterFace: true },
  })
  if (!bar) return { success: false, error: 'BAR not found' }
  if (bar.creatorId !== player.id) return { success: false, error: 'This BAR belongs to another player' }

  // Resolve move type
  const wcgsStage = nurseryTypeToWcgs(input.nurseryType)
  const moveType = wcgsStage ? wcgsToMoveType(wcgsStage) : input.nurseryType.replace(/-/g, '')

  // Upsert SpokeMoveBed
  let planted = false
  try {
    const existing = await dbBase.spokeMoveBed.findUnique({
      where: {
        campaignRef_spokeIndex_moveType: {
          campaignRef,
          spokeIndex: input.spokeIndex,
          moveType,
        },
      },
    })

    if (existing && !existing.anchorBarId) {
      await dbBase.spokeMoveBed.update({
        where: { id: existing.id },
        data: {
          anchorBarId: bar.id,
          anchoredByPlayerId: player.id,
          anchoredAt: new Date(),
        },
      })
      planted = true
    } else if (!existing) {
      await dbBase.spokeMoveBed.create({
        data: {
          campaignRef,
          spokeIndex: input.spokeIndex,
          moveType,
          anchorBarId: bar.id,
          anchoredByPlayerId: player.id,
          anchoredAt: new Date(),
        },
      })
      planted = true
    }
    // If existing.anchorBarId set → first-mover wins
  } catch {
    // Non-critical — BAR still exists
  }

  // Claim the BAR (mark as placed)
  if (planted) {
    await dbBase.customBar.update({
      where: { id: bar.id },
      data: { claimedById: player.id },
    })
  }

  // Write hub receipt
  if (planted) {
    try {
      const raw = instance.campaignHubState
      const hubState: CampaignHubStateV1 = isCampaignHubStateV1(raw)
        ? raw
        : { v: 1, kotterStage: 1, spokes: [], completedBuilds: [], updatedAt: new Date().toISOString() }

      const receipt: CompletedBuildReceipt = {
        buildId: bar.id,
        spokeIndex: input.spokeIndex,
        face: (bar.gameMasterFace ?? 'sage') as any,
        templateKind: 'nursery_ritual',
        templateKey: moveType,
        emotionalVector: { channelFrom: 'Fear', altitudeFrom: 'dissatisfied', channelTo: 'Joy', altitudeTo: 'neutral' },
        chargeText: bar.title.slice(0, 120),
        terminalNodeId: 'planted',
        blueprintKey: `nursery_${input.nurseryType}_planted`,
        barSummaries: [{ barId: bar.id, title: bar.title, type: bar.type as 'vibe' | 'story' | 'insight', vibeulons: 1 }],
        totalVibeulons: 1,
        completedAt: new Date().toISOString(),
      }

      const builds = hubState.completedBuilds ?? []
      builds.push(receipt)

      await dbBase.instance.update({
        where: { id: instance.id },
        data: {
          campaignHubState: { ...hubState, completedBuilds: builds, updatedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
        },
      })
    } catch { /* non-critical */ }

    // Award vibeulons for planting
    await dbBase.vibulonEvent.create({
      data: {
        playerId: player.id,
        source: 'nursery_plant',
        amount: 1,
        notes: `Planted BAR on spoke ${input.spokeIndex} (${moveType})`,
      },
    })
  }

  revalidatePath('/campaign/hub')
  revalidatePath(`/world/${input.instanceSlug}`)
  revalidatePath('/hand')

  return { success: true, planted }
}
