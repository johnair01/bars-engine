'use server'

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import {
  scoreQuestForActor,
  scoreActorForQuest,
  RECOMMENDATION_THRESHOLD,
  type EligibleQuest,
  type EligibleActor,
  type ActorContext,
  type QuestSnapshot,
} from '@/lib/actor-eligibility'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Load actor context (nation, archetype, wave stage) for scoring. */
async function loadActorContext(playerId: string): Promise<ActorContext | null> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: {
      nation: { select: { name: true } },
      archetype: { select: { name: true, primaryWaveStage: true } },
    },
  })
  if (!player) return null
  return {
    nationName: player.nation?.name ?? null,
    archetypeName: player.archetype?.name ?? null,
    primaryWaveStage: player.archetype?.primaryWaveStage ?? null,
  }
}

/** Load the set of moveTypes this player has completed quests in. */
async function loadCompletedMoveTypes(playerId: string): Promise<string[]> {
  const pqs = await db.playerQuest.findMany({
    where: { playerId, status: 'completed' },
    select: { quest: { select: { moveType: true } } },
  })
  return pqs.map((pq) => pq.quest.moveType).filter((mt): mt is string => mt !== null)
}

// ---------------------------------------------------------------------------
// getEligibleQuestsForActor
// ---------------------------------------------------------------------------

export interface QuestEligibilityOpts {
  pool?: string
  moveType?: string
  limit?: number
}

export async function getEligibleQuestsForActor(
  playerId: string,
  opts: QuestEligibilityOpts = {}
): Promise<EligibleQuest[] | { error: string }> {
  const actorCtx = await loadActorContext(playerId)
  if (!actorCtx) return { error: 'Player not found' }

  // IDs the player has already assigned or completed
  const takenQuestIds = await db.playerQuest
    .findMany({
      where: { playerId, status: { in: ['assigned', 'completed'] } },
      select: { questId: true },
    })
    .then((rows) => new Set(rows.map((r) => r.questId)))

  const where: Prisma.CustomBarWhereInput = {
    status: 'active',
    visibility: 'public',
    type: { not: 'charge_capture' },
    ...(opts.pool ? { questPool: opts.pool } : {}),
    ...(opts.moveType ? { moveType: opts.moveType } : {}),
  }

  const quests = await db.customBar.findMany({
    where,
    take: (opts.limit ?? 20) + takenQuestIds.size,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      moveType: true,
      questPool: true,
      nation: true,
      archetype: true,
      emotionalAlchemyTag: true,
    },
  })

  const eligible: EligibleQuest[] = []
  for (const q of quests) {
    if (takenQuestIds.has(q.id)) continue
    const snap: QuestSnapshot = {
      nation: q.nation ?? null,
      archetype: q.archetype ?? null,
      moveType: q.moveType ?? null,
      questPool: q.questPool ?? null,
    }
    const score = scoreQuestForActor(snap, actorCtx)
    eligible.push({
      questId: q.id,
      title: q.title,
      type: q.type,
      moveType: q.moveType ?? null,
      questPool: q.questPool ?? null,
      nation: q.nation ?? null,
      archetype: q.archetype ?? null,
      emotionalAlchemyTag: q.emotionalAlchemyTag ?? null,
      score,
      isRecommended: score >= RECOMMENDATION_THRESHOLD,
    })
    if (eligible.length >= (opts.limit ?? 20)) break
  }

  return eligible
}

// ---------------------------------------------------------------------------
// getRecommendedQuestsForActor
// ---------------------------------------------------------------------------

export async function getRecommendedQuestsForActor(
  playerId: string,
  opts: QuestEligibilityOpts = {}
): Promise<EligibleQuest[] | { error: string }> {
  const all = await getEligibleQuestsForActor(playerId, { ...opts, limit: (opts.limit ?? 20) * 3 })
  if ('error' in all) return all

  return all
    .filter((q) => q.isRecommended)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 20)
}

// ---------------------------------------------------------------------------
// getEligibleActorsForQuest
// ---------------------------------------------------------------------------

export async function getEligibleActorsForQuest(
  questId: string
): Promise<EligibleActor[] | { error: string }> {
  const quest = await db.customBar.findUnique({
    where: { id: questId },
    select: {
      id: true,
      nation: true,
      archetype: true,
      moveType: true,
      questPool: true,
      creatorId: true,
    },
  })
  if (!quest) return { error: 'Quest not found' }

  const questSnap: QuestSnapshot = {
    nation: quest.nation ?? null,
    archetype: quest.archetype ?? null,
    moveType: quest.moveType ?? null,
    questPool: quest.questPool ?? null,
  }

  // Players who have declined or are already confirmed stewards — exclude them
  const excludedPlayerIds = await db.barResponse
    .findMany({
      where: { barId: questId, depth: 0, intent: 'decline' },
      select: { responderId: true },
    })
    .then((rows) => new Set(rows.map((r) => r.responderId)))

  const assignedIds = await db.playerQuest
    .findMany({
      where: { questId, status: { in: ['assigned', 'completed'] } },
      select: { playerId: true },
    })
    .then((rows) => new Set(rows.map((r) => r.playerId)))

  const players = await db.player.findMany({
    where: { onboardingComplete: true, creatorType: 'human' },
    take: 200,
    select: {
      id: true,
      name: true,
      nation: { select: { name: true } },
      archetype: { select: { name: true, primaryWaveStage: true } },
    },
  })

  const eligible: EligibleActor[] = []
  for (const p of players) {
    if (excludedPlayerIds.has(p.id) || assignedIds.has(p.id)) continue
    const actorCtx: ActorContext = {
      nationName: p.nation?.name ?? null,
      archetypeName: p.archetype?.name ?? null,
      primaryWaveStage: p.archetype?.primaryWaveStage ?? null,
    }
    const score = scoreActorForQuest(actorCtx, questSnap)
    eligible.push({
      playerId: p.id,
      name: p.name,
      nationName: p.nation?.name ?? null,
      archetypeName: p.archetype?.name ?? null,
      primaryWaveStage: p.archetype?.primaryWaveStage ?? null,
      score,
      isRecommended: score >= RECOMMENDATION_THRESHOLD,
    })
  }

  return eligible
}

// ---------------------------------------------------------------------------
// getRecommendedRespondersForQuest
// ---------------------------------------------------------------------------

export async function getRecommendedRespondersForQuest(
  questId: string,
  limit = 10
): Promise<EligibleActor[] | { error: string }> {
  const all = await getEligibleActorsForQuest(questId)
  if ('error' in all) return all

  // Enrich with completed move history for top candidates
  const sorted = all.sort((a, b) => b.score - a.score).slice(0, limit * 3)

  const enriched: EligibleActor[] = await Promise.all(
    sorted.map(async (actor) => {
      if (actor.score === 0) return actor
      const completedMoveTypes = await loadCompletedMoveTypes(actor.playerId)
      const questSnap = await db.customBar.findUnique({
        where: { id: questId },
        select: { nation: true, archetype: true, moveType: true, questPool: true },
      })
      if (!questSnap) return actor
      const snap: QuestSnapshot = {
        nation: questSnap.nation ?? null,
        archetype: questSnap.archetype ?? null,
        moveType: questSnap.moveType ?? null,
        questPool: questSnap.questPool ?? null,
      }
      const enrichedCtx: ActorContext = {
        nationName: actor.nationName,
        archetypeName: actor.archetypeName,
        primaryWaveStage: actor.primaryWaveStage,
        completedMoveTypes,
      }
      const score = scoreActorForQuest(enrichedCtx, snap)
      return { ...actor, score, isRecommended: score >= RECOMMENDATION_THRESHOLD }
    })
  )

  return enriched
    .filter((a) => a.isRecommended)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
