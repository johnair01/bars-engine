'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { appendCyoaArtifactBar } from '@/actions/cyoa-artifact-ledger'
import { parsePortalMoveFromBlueprintKey } from '@/lib/spoke-move-beds'

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
  blueprintKey?: string
  /** SMB: hub portal spoke index 0–7; stamps agentMetadata for anchor eligibility */
  spokeIndex?: number | null
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

  const spokeMove =
    campaignRef &&
    input.spokeIndex != null &&
    Number.isFinite(input.spokeIndex) &&
    input.spokeIndex >= 0 &&
    input.spokeIndex <= 7
      ? parsePortalMoveFromBlueprintKey(input.blueprintKey)
      : null
  const spokePortal =
    campaignRef && spokeMove != null
      ? { campaignRef, spokeIndex: input.spokeIndex as number, moveType: spokeMove }
      : null

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
        claimedById: null, // Unclaimed draft — appears in vault; claimed on plant/accept
        inputs: JSON.stringify([]),
        rootId: `passage_${input.passageNodeId}`,
        campaignRef,
        allyshipDomain,
        agentMetadata: JSON.stringify({
          sourceType: 'passage_adventure',
          adventureId: input.adventureId,
          passageNodeId: input.passageNodeId,
          blueprintKey: input.blueprintKey,
          ...(spokePortal ? { spokePortal } : {}),
        }),
      },
    })

    revalidatePath('/', 'layout')
    revalidatePath('/bars')
    revalidatePath('/hand')

    await appendCyoaArtifactBar(input.adventureId, {
      barId: bar.id,
      passageNodeId: input.passageNodeId,
      source: 'passage_emit',
      blueprintKey: input.blueprintKey,
    }).catch(() => {
      /* ledger is best-effort; BAR already created */
    })

    return { success: true, barId: bar.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create BAR'
    return { error: msg }
  }
}
