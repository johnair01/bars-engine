'use server'

/**
 * Unified admin quest generation from context.
 * @see .specify/specs/game-loop-tighten-admin-player/spec.md
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateRandomUnpacking, getArchetypePrimaryWave } from '@/lib/quest-grammar'
import { compileQuestWithAI, publishGameboardAlignedQuestToPlayer } from '@/actions/quest-grammar'
import type { ElementKey } from '@/lib/quest-grammar/elements'
import type { SerializableQuestPacket } from '@/lib/quest-grammar'
import { getActiveInstance } from '@/actions/instance'
import { getStageAction } from '@/lib/kotter'
import type { AllyshipDomain } from '@/lib/kotter'
import { getArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay'

const ELEMENT_KEYS: ElementKey[] = ['metal', 'water', 'wood', 'fire', 'earth']

export type GenerateQuestFromContextInput = {
  campaignRef: string
  kotterStage?: number
  slotId?: string
  slotQuestId?: string
  allyshipDomain?: string
  template?: 'epiphany_bridge' | 'kotter'
  moveType?: string
}

async function checkAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  const adminRole = await db.playerRole.findFirst({
    where: {
      playerId: player.id,
      role: { key: 'admin' },
    },
  })

  if (!adminRole) throw new Error('Not authorized')
  return player
}

function buildGameboardContext(
  parentQuest: { title: string; description: string | null; allyshipDomain?: string | null },
  period: number,
  instance: { targetDescription?: string | null } | null,
  campaignRef: string
) {
  const domain = (parentQuest.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain
  const stageAction = getStageAction(period, domain)
  const campaignGoal =
    instance?.targetDescription?.trim() || `${campaignRef} — people showing up`
  return {
    parentTitle: parentQuest.title,
    parentDescription: parentQuest.description ?? '',
    period,
    campaignGoal,
    stageAction,
  }
}

/**
 * Admin-only. Generate a grammatical quest from context.
 * When slotId/slotQuestId provided, auto-attaches to slot. Otherwise returns draft for manual placement.
 */
export async function generateQuestFromContext(
  input: GenerateQuestFromContextInput
): Promise<{ success: true; questId: string } | { error: string }> {
  try {
    await checkAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Not authorized' }
  }

  if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
    return {
      error:
        'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable. See docs/ENV_AND_VERCEL.md',
    }
  }

  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  const playerWithRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } }, nation: true, archetype: true },
  })
  if (!playerWithRoles) return { error: 'Player not found' }

  const nationElement: ElementKey | undefined =
    playerWithRoles.nation?.element && ELEMENT_KEYS.includes(playerWithRoles.nation.element as ElementKey)
      ? (playerWithRoles.nation.element as ElementKey)
      : undefined
  const archetypePrimaryWave = playerWithRoles.archetypeId
    ? await getArchetypePrimaryWave(playerWithRoles.archetypeId)
    : undefined

  const { unpackingAnswers, alignedAction, moveType } = generateRandomUnpacking({
    nationElement,
    archetypePrimaryWave,
  })

  const instance = await getActiveInstance()
  const period = input.kotterStage ?? instance?.kotterStage ?? 1

  let parentQuest: { id: string; title: string; description: string | null; allyshipDomain?: string | null } | null =
    null
  let slotQuestId: string | undefined = input.slotQuestId

  if (input.slotId) {
    const slot = await db.gameboardSlot.findUnique({
      where: { id: input.slotId },
      include: { quest: true },
    })
    if (!slot || !slot.quest) return { error: 'Slot or slot quest not found' }
    parentQuest = slot.quest
    slotQuestId = slot.questId ?? undefined
  } else if (input.slotQuestId) {
    parentQuest = await db.customBar.findUnique({
      where: { id: input.slotQuestId },
      select: { id: true, title: true, description: true, allyshipDomain: true },
    })
  }

  const gameboardContext =
    parentQuest && input.campaignRef
      ? buildGameboardContext(parentQuest, period, instance, input.campaignRef)
      : undefined

  const archetypeInfluenceProfile = playerWithRoles.archetype?.name
    ? getArchetypeInfluenceProfile(playerWithRoles.archetype.name) ?? null
    : null

  const compileResult = await compileQuestWithAI({
    unpackingAnswers,
    alignedAction,
    segment: 'player',
    targetArchetypeId: playerWithRoles.archetypeId ?? undefined,
    moveType: (input.moveType ?? moveType) as import('@/lib/quest-grammar/types').PersonalMoveType | undefined,
    gameboardContext,
    archetypeInfluenceProfile,
  })

  if ('error' in compileResult) {
    const err = compileResult.error
    if (err.includes('OPENAI_API_KEY') || err.includes('apiKey')) {
      return {
        error:
          'OPENAI_API_KEY is not set. Add it to .env.local or Vercel Environment Variables. See docs/ENV_AND_VERCEL.md',
      }
    }
    return { error: err }
  }

  const packet = compileResult.packet as SerializableQuestPacket

  if (parentQuest && slotQuestId) {
    const publishResult = await publishGameboardAlignedQuestToPlayer(
      packet,
      player.id,
      slotQuestId,
      input.campaignRef,
      parentQuest.title
    )

    if (!publishResult.success) return { error: publishResult.error }

    revalidatePath('/campaign/board')
    revalidatePath('/')
    return { success: true, questId: publishResult.questId }
  }

  const title =
    packet.signature?.satisfiedLabels?.[0] ?? packet.signature?.dissatisfiedLabels?.[0] ?? 'Draft Quest'
  const firstNode = packet.nodes?.[0]
  const description =
    firstNode?.text?.slice(0, 500) ??
    `From ${packet.signature?.dissatisfiedLabels?.[0] ?? 'stuck'} to ${packet.signature?.satisfiedLabels?.[0] ?? 'aligned'}.`

  const draft = await db.customBar.create({
    data: {
      creatorId: player.id,
      title,
      description,
      type: 'vibe',
      reward: 1,
      status: 'draft',
      visibility: 'public',
      campaignRef: input.campaignRef,
      allyshipDomain: (input.allyshipDomain ?? 'GATHERING_RESOURCES') as AllyshipDomain,
      moveType: packet.signature?.moveType ?? input.moveType ?? undefined,
      isSystem: true,
      inputs: JSON.stringify([]),
    },
  })

  revalidatePath('/admin/quests')
  revalidatePath('/')
  return { success: true, questId: draft.id }
}
