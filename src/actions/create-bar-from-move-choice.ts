'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { appendCyoaArtifactBar } from '@/actions/cyoa-artifact-ledger'
import { isValidAspectTarget } from '@/lib/quest-grammar/move-aspect'
import type { MoveAspect, AllyshipTarget } from '@/lib/quest-grammar/types'

// Layer 0 base moves — the full WAVE set, including the fifth move (Open Up).
const MOVE_TYPES = ['wakeUp', 'openUp', 'cleanUp', 'growUp', 'showUp'] as const
type MoveType = (typeof MOVE_TYPES)[number]

function isValidMoveType(s: string): s is MoveType {
  return MOVE_TYPES.includes(s as MoveType)
}

const MOVE_LABELS: Record<MoveType, string> = {
  wakeUp: 'Wake Up',
  openUp: 'Open Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

const VALID_ASPECTS: readonly MoveAspect[] = ['inner', 'outer']
const VALID_TARGETS: readonly AllyshipTarget[] = ['individual', 'collective', 'system']

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
  /** IOA base layer: inner (self) | outer (allyship). Optional — Nation-free. */
  aspect?: MoveAspect
  /** Required when aspect === 'outer'; omitted for inner. */
  target?: AllyshipTarget
}): Promise<CreateBarFromMoveChoiceResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  if (!isValidMoveType(input.moveType)) {
    return { error: `Invalid moveType: ${input.moveType}` }
  }

  // Aspect is optional, but when present it must satisfy the allyship invariant
  // (outer ⇒ target; inner ⇒ none) — one source of truth with the grammar.
  if (input.aspect !== undefined) {
    if (!VALID_ASPECTS.includes(input.aspect)) {
      return { error: `Invalid aspect: ${String(input.aspect)}` }
    }
    if (input.target !== undefined && !VALID_TARGETS.includes(input.target)) {
      return { error: `Invalid target: ${String(input.target)}` }
    }
    if (!isValidAspectTarget(input.aspect, input.target)) {
      return {
        error:
          input.aspect === 'outer'
            ? 'Outer (allyship) moves require a target (individual, collective, or system).'
            : 'Inner moves are self-directed and cannot carry a target.',
      }
    }
  } else if (input.target !== undefined) {
    return { error: 'A target requires an outer aspect.' }
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
        moveAspect: input.aspect ?? null,
        allyshipTarget: input.target ?? null,
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
    revalidatePath('/vault')

    const blueprintKey = `move_${input.moveType}`
    await appendCyoaArtifactBar(input.adventureId, {
      barId: bar.id,
      passageNodeId: input.passageNodeId,
      source: 'move_choice',
      blueprintKey,
    }).catch(() => {})

    return { success: true, barId: bar.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create BAR'
    return { error: msg }
  }
}
