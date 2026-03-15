'use server'

import { db } from '@/lib/db'
import { validateNpcAction, type NpcActionInput } from '@/lib/npc-action-validator'

/**
 * Executes an NPC action after validation.
 *
 * Verb-to-system wiring:
 *   offer_quest_seed  → creates a QuestProposal visible on player dashboard
 *   reflect_bar       → surfaces BAR content reference in payload
 *   reveal_lore       → injects lore passage reference in payload
 *
 * All other verbs are recorded for NPC context but have no additional side effects in v0.
 */
export async function executeNpcAction(
  npcId: string,
  verb: string,
  payload: Record<string, unknown>,
  options?: { sceneId?: string; requiresRegentApproval?: boolean }
) {
  const npc = await db.npcConstitution.findUnique({
    where: { id: npcId },
    select: { status: true, limits: true, name: true },
  })

  if (!npc) return { error: 'NPC not found' }

  const actionInput: NpcActionInput = {
    verb,
    payload,
    requiresRegentApproval: options?.requiresRegentApproval,
  }

  const validation = validateNpcAction(actionInput, { status: npc.status, limits: npc.limits })

  // Record the action attempt regardless of outcome
  const action = await db.npcAction.create({
    data: {
      npcId,
      sceneId: options?.sceneId,
      verb,
      payload: JSON.stringify(payload),
      requiresRegentApproval: validation.decision === 'requires_review',
      status:
        validation.decision === 'allowed'
          ? 'executed'
          : validation.decision === 'requires_review'
          ? 'pending'
          : 'blocked',
      reason: validation.reason,
    },
  })

  if (!validation.valid && validation.decision === 'blocked') {
    return { error: validation.reason, action }
  }

  if (validation.decision === 'requires_review') {
    return { requiresReview: true, action }
  }

  // Side-effect wiring per verb
  const sideEffect = await dispatchVerbSideEffect(verb, payload, npcId)

  return { success: true, action, sideEffect }
}

async function dispatchVerbSideEffect(
  verb: string,
  payload: Record<string, unknown>,
  npcId: string
): Promise<Record<string, unknown> | null> {
  switch (verb) {
    case 'offer_quest_seed': {
      // Quest seeds from NPCs surface as structured payload on the player dashboard.
      // Full QuestProposal creation requires a barId link — deferred to GM workflow.
      return {
        questSeed: {
          title: payload.title ?? null,
          description: payload.description ?? null,
          playerId: payload.playerId ?? null,
          sourceNpc: npcId,
          status: 'seed', // not yet a full QuestProposal
        },
      }
    }

    case 'reflect_bar': {
      // Return the BAR reference from payload for surface on player dashboard
      return {
        barReference: payload.barId ?? null,
        reflection: payload.reflection ?? null,
      }
    }

    case 'reveal_lore': {
      // Return passage reference for lore injection
      return {
        passageRef: payload.passageId ?? null,
        loreText: payload.lore ?? null,
      }
    }

    default:
      return null
  }
}

export async function getNpcActions(npcId: string, status?: string) {
  return db.npcAction.findMany({
    where: {
      npcId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}
