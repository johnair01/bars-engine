'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
type MoveType = (typeof MOVE_TYPES)[number]

function isValidMoveType(s: string): s is MoveType {
  return MOVE_TYPES.includes(s as MoveType)
}

const MOVE_LABELS: Record<MoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

export type CreateBarFromMoveChoiceResult =
  | { success: true; barId: string }
  | { error: string }

/**
 * Create a BAR when a CYOA move choice is executed.
 * The move itself is represented as a BAR (Move as BAR).
 */
export async function createBarFromMoveChoice(input: {
  moveType: string
  passageNodeId: string
  adventureId: string
  passageText?: string
  choiceText?: string
  questId?: string
  campaignRef?: string | null
}): Promise<CreateBarFromMoveChoiceResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  if (!isValidMoveType(input.moveType)) {
    return { error: `Invalid moveType: ${input.moveType}` }
  }

  const label = MOVE_LABELS[input.moveType]
  const title = input.choiceText
    ? `${label}: ${input.choiceText}`
    : `${label} (from passage)`
  const description = input.passageText?.trim() || input.choiceText?.trim() || ''

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
        description,
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: player.id,
        inputs: JSON.stringify([]),
        moveType: input.moveType,
        parentId: input.questId ?? null,
        rootId: `cyoa_move_${input.passageNodeId}`,
        campaignRef,
        allyshipDomain,
        agentMetadata: JSON.stringify({
          sourceType: 'cyoa_move',
          adventureId: input.adventureId,
          passageNodeId: input.passageNodeId,
          moveType: input.moveType,
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
