'use server'

/**
 * Campaign Hub/Spoke — direct seed planting from the CYOA adventure player.
 *
 * Unlike plantSeedFromCyoa (which requires a PlayerPlaybook record),
 * this action is called directly from AdventurePlayer when a spoke CYOA
 * reaches its terminal node. It creates a seed BAR from spoke context
 * (campaignRef, spokeIndex, hexagramId, face) without a playbook intermediary.
 *
 * Idempotent: a second call for the same player/campaign/spoke returns the
 * existing seed BAR without creating a duplicate.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type PlantSeedFromSpokeResult =
  | { success: true; barId: string }
  | { error: string }

export async function plantSeedFromSpoke(input: {
  campaignRef: string
  spokeIndex: number
  hexagramId?: number
  portalFace?: string
}): Promise<PlantSeedFromSpokeResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const { campaignRef, spokeIndex, hexagramId, portalFace } = input

  // Idempotency: check for existing seed BAR from this player/campaign/spoke.
  // spokeIndex is stored as a JSON key in agentMetadata.
  const idempotencyKey = `"spokeIndex":${spokeIndex}`
  const existing = await db.customBar.findFirst({
    where: {
      creatorId: player.id,
      campaignRef,
      status: 'seed',
      agentMetadata: { contains: idempotencyKey },
    },
    select: { id: true },
  })
  if (existing) return { success: true, barId: existing.id }

  // Resolve campaign domain for BAR attribution
  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef }, { slug: campaignRef }] },
    select: { allyshipDomain: true, primaryCampaignDomain: true },
  })
  const allyshipDomain =
    instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null

  const title = `Seed: Spoke ${spokeIndex + 1}${hexagramId ? ` · Hexagram ${hexagramId}` : ''}`

  const agentMetadata = JSON.stringify({
    sourceType: 'spoke_cyoa_seed',
    spokeIndex,
    hexagramId: hexagramId ?? null,
    portalFace: portalFace ?? null,
    campaignRef,
    plantedAt: new Date().toISOString(),
  })

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        claimedById: player.id,
        title,
        description: '',
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'seed',
        inputs: JSON.stringify([]),
        campaignRef,
        allyshipDomain,
        agentMetadata,
      },
      select: { id: true },
    })

    revalidatePath('/campaign/hub')
    revalidatePath('/campaign/landing')
    revalidatePath('/hand')

    return { success: true, barId: bar.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create seed BAR'
    return { error: msg }
  }
}
