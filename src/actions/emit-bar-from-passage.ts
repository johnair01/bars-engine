'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type EmitBarFromPassageResult =
  | { success: true; barId: string }
  | { error: string }

/**
 * Create a BAR from a CYOA passage (bar_emit).
 * Assigns to player's wallet with provenance pointing to passage/adventure.
 * When campaignRef is provided, inherits allyshipDomain from the Instance (campaign context).
 */
export async function emitBarFromPassage(input: {
  title: string
  description: string
  adventureId: string
  passageNodeId: string
  campaignRef?: string | null
}): Promise<EmitBarFromPassageResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const title = input.title?.trim()
  if (!title) return { error: 'Title is required' }

  let allyshipDomain: string | null = null
  let campaignRef: string | null = null
  if (input.campaignRef?.trim()) {
    campaignRef = input.campaignRef.trim()
    const instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { allyshipDomain: true, primaryCampaignDomain: true },
    })
    allyshipDomain = instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null
  }

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: player.id,
        title,
        description: input.description?.trim() || '',
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: player.id,
        inputs: JSON.stringify([]),
        rootId: `passage_${input.passageNodeId}`,
        campaignRef,
        allyshipDomain,
        agentMetadata: JSON.stringify({
          sourceType: 'passage_adventure',
          adventureId: input.adventureId,
          passageNodeId: input.passageNodeId,
        }),
      },
    })

    revalidatePath('/', 'layout')
    revalidatePath('/bars')
    revalidatePath('/hand')

    return { success: true, barId: bar.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create BAR'
    return { error: msg }
  }
}
