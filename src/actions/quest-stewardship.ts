'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getBarRoles } from '@/actions/bar-responses'
import {
  STEWARD_INTENTS,
  deriveQuestState,
  type QuestLifecycleState,
  type StewardResolution,
  type QuestRoleResolution,
} from '@/lib/quest-stewardship'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

// ---------------------------------------------------------------------------
// takeQuest
// ---------------------------------------------------------------------------

/**
 * Current player takes stewardship of a quest:
 * - Upserts BarResponse with intent='take_quest'
 * - Upserts PlayerQuest with status='assigned'
 */
export async function takeQuest(
  questId: string
): Promise<{ success: true; playerQuestId: string } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: { id: true },
  })
  if (!quest) return { error: 'Quest not found' }

  // Upsert BarResponse with take_quest intent
  const existingResponse = await db.barResponse.findUnique({
    where: { barId_responderId: { barId: questId, responderId: playerId } },
    select: { id: true },
  })

  if (existingResponse) {
    await db.barResponse.update({
      where: { id: existingResponse.id },
      data: { responseType: 'join', intent: 'take_quest', raciRole: 'Responsible' },
    })
  } else {
    await db.barResponse.create({
      data: {
        barId: questId,
        responderId: playerId,
        responseType: 'join',
        intent: 'take_quest',
        raciRole: 'Responsible',
        depth: 0,
      },
    })
  }

  // Upsert PlayerQuest
  const existing = await db.playerQuest.findUnique({
    where: { playerId_questId: { playerId, questId } },
    select: { id: true, status: true },
  })

  let playerQuestId: string
  if (existing) {
    if (existing.status === 'completed') {
      return { error: 'Quest already completed' }
    }
    await db.playerQuest.update({
      where: { id: existing.id },
      data: { status: 'assigned' },
    })
    playerQuestId = existing.id
  } else {
    const created = await db.playerQuest.create({
      data: { playerId, questId, status: 'assigned' },
      select: { id: true },
    })
    playerQuestId = created.id
  }

  return { success: true, playerQuestId }
}

// ---------------------------------------------------------------------------
// releaseQuest
// ---------------------------------------------------------------------------

/**
 * Current player releases stewardship:
 * - Updates BarResponse to intent='decline', raciRole=null
 * - Updates PlayerQuest status to 'released'
 */
export async function releaseQuest(
  questId: string
): Promise<{ success: true } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const response = await db.barResponse.findUnique({
    where: { barId_responderId: { barId: questId, responderId: playerId } },
    select: { id: true },
  })

  if (response) {
    await db.barResponse.update({
      where: { id: response.id },
      data: { intent: 'decline', raciRole: null },
    })
  }

  const pq = await db.playerQuest.findUnique({
    where: { playerId_questId: { playerId, questId } },
    select: { id: true, status: true },
  })

  if (pq && pq.status !== 'completed') {
    await db.playerQuest.update({
      where: { id: pq.id },
      data: { status: 'released' },
    })
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// resolveQuestStewards
// ---------------------------------------------------------------------------

export async function resolveQuestStewards(
  questId: string
): Promise<StewardResolution | { error: string }> {
  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: { id: true },
  })
  if (!quest) return { error: 'Quest not found' }

  // BarResponse records with steward intent
  const intentFilter = STEWARD_INTENTS as unknown as string[]
  const responses = await db.barResponse.findMany({
    where: { barId: questId, depth: 0, intent: { in: intentFilter } },
    select: {
      responderId: true,
      intent: true,
      responder: { select: { id: true, name: true } },
    },
  })

  if (responses.length === 0) {
    return { confirmed: [], candidates: [] }
  }

  // PlayerQuest entries for these players
  const responderIds = responses.map((r) => r.responderId)
  const playerQuests = await db.playerQuest.findMany({
    where: { questId, playerId: { in: responderIds }, status: 'assigned' },
    select: { playerId: true },
  })
  const confirmedIds = new Set(playerQuests.map((pq) => pq.playerId))

  const confirmed = responses
    .filter((r) => confirmedIds.has(r.responderId))
    .map((r) => ({
      playerId: r.responder.id,
      name: r.responder.name,
      intent: r.intent ?? '',
      confirmed: true as const,
    }))

  const candidates = responses
    .filter((r) => !confirmedIds.has(r.responderId))
    .map((r) => ({
      playerId: r.responder.id,
      name: r.responder.name,
      intent: r.intent ?? '',
      confirmed: false as const,
    }))

  return { confirmed, candidates }
}

// ---------------------------------------------------------------------------
// resolveQuestState
// ---------------------------------------------------------------------------

export async function resolveQuestState(
  questId: string
): Promise<QuestLifecycleState | { error: string }> {
  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: { id: true },
  })
  if (!quest) return { error: 'Quest not found' }

  const intentFilter = STEWARD_INTENTS as unknown as string[]
  const [completedCount, assignedCount, intentCount] = await Promise.all([
    db.playerQuest.count({ where: { questId, status: 'completed' } }),
    db.playerQuest.count({ where: { questId, status: 'assigned' } }),
    db.barResponse.count({ where: { barId: questId, depth: 0, intent: { in: intentFilter } } }),
  ])

  return deriveQuestState({
    completedPlayerQuestCount: completedCount,
    assignedPlayerQuestCount: assignedCount,
    stewardIntentResponseCount: intentCount,
  })
}

// ---------------------------------------------------------------------------
// getQuestRoleResolution
// ---------------------------------------------------------------------------

/**
 * Combined resolution: state + stewards + full RACI roles.
 * Primary output of GB; consumed by GC (eligibility) and GH (events).
 */
export async function getQuestRoleResolution(
  questId: string
): Promise<QuestRoleResolution | { error: string }> {
  const [state, stewards, roles] = await Promise.all([
    resolveQuestState(questId),
    resolveQuestStewards(questId),
    getBarRoles(questId),
  ])

  if (typeof state !== 'string') return state as { error: string }
  if ('error' in stewards) return stewards
  if ('error' in roles) return roles

  return { questId, state, stewards, roles }
}
