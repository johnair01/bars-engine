'use server'

/**
 * Quest ↔ lens-goal reads (QLA).
 *
 * A quest is **aligned** when it hangs on an active `week`-cadence lens goal that
 * rolls up month→quarter→year; otherwise it is a **shadow quest** (out of alignment),
 * surfaced for fold-in. Lineage is resolved through the existing snapshot machinery.
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { buildLensGoalSnapshot, resolveLensGoalTrace } from '@/lib/lenses/lineage'
import type { LensGoalTrace } from '@/lib/lenses/lineage-types'

export type QuestLineageResult = { trace: LensGoalTrace | null; aligned: boolean }

/** Resolve a quest's week→year lineage chain + whether it is aligned to a weekly goal. */
export async function getQuestLineage(questId: string): Promise<QuestLineageResult | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const quest = await db.customBar.findFirst({
    where: { id: questId, creatorId: player.id },
    select: { lensGoalId: true, plantSnapshot: true },
  })
  if (!quest) return { error: 'Quest not found' }

  const trace = await resolveLensGoalTrace({
    playerId: player.id,
    lensGoalId: quest.lensGoalId,
    plantSnapshot: quest.plantSnapshot,
  })

  const aligned = trace?.goal.cadence === 'week' && trace.goal.status === 'active'
  return { trace, aligned }
}

// ── Shadow quests ────────────────────────────────────────────────────────────

export type ShadowReason = 'no_goal' | 'goal_inactive' | 'not_weekly'
export type ShadowQuestDTO = {
  id: string
  title: string
  description: string
  createdAt: string
  lensGoalId: string | null
  acknowledged: boolean
  reason: ShadowReason
}

/** Owned active quests NOT hanging on an active weekly goal — the shadow set. */
export async function listShadowQuests(): Promise<{ quests: ShadowQuestDTO[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const quests = await db.customBar.findMany({
    where: { creatorId: player.id, type: 'quest', status: 'active', archivedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, title: true, description: true, createdAt: true, lensGoalId: true, shadowAcknowledgedAt: true },
  })

  const goalIds = [...new Set(quests.map((q) => q.lensGoalId).filter((x): x is string => !!x))]
  const goals = goalIds.length
    ? await db.lensGoal.findMany({
        where: { id: { in: goalIds }, playerId: player.id },
        select: { id: true, cadence: true, status: true },
      })
    : []
  const goalById = new Map(goals.map((g) => [g.id, g]))

  const shadow: ShadowQuestDTO[] = []
  for (const q of quests) {
    let reason: ShadowReason | null = null
    if (!q.lensGoalId) {
      reason = 'no_goal'
    } else {
      const g = goalById.get(q.lensGoalId)
      if (!g || g.status !== 'active') reason = 'goal_inactive'
      else if (g.cadence !== 'week') reason = 'not_weekly'
    }
    if (reason) {
      shadow.push({
        id: q.id,
        title: q.title,
        description: q.description,
        createdAt: q.createdAt.toISOString(),
        lensGoalId: q.lensGoalId,
        acknowledged: !!q.shadowAcknowledgedAt,
        reason,
      })
    }
  }
  return { quests: shadow }
}

export type WeeklyGoalOption = { id: string; domain: string; title: string }

/** Active weekly goals — fold-in targets for shadow quests. */
export async function listActiveWeeklyGoals(): Promise<WeeklyGoalOption[]> {
  const player = await getCurrentPlayer()
  if (!player) return []
  return db.lensGoal.findMany({
    where: { playerId: player.id, status: 'active', cadence: 'week' },
    orderBy: [{ domain: 'asc' }, { keepOrder: 'asc' }],
    select: { id: true, domain: true, title: true },
  })
}

/** Fold a shadow quest into a weekly goal — attaches lineage + clears the shadow flag. */
export async function foldQuestIntoGoal(input: {
  questId: string
  weeklyLensGoalId: string
}): Promise<{ aligned: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const quest = await db.customBar.findFirst({
    where: { id: input.questId, creatorId: player.id, type: 'quest' },
    select: { id: true },
  })
  if (!quest) return { error: 'Quest not found' }

  const goal = await db.lensGoal.findFirst({
    where: { id: input.weeklyLensGoalId, playerId: player.id, status: 'active', cadence: 'week' },
    select: { id: true },
  })
  if (!goal) return { error: 'Pick an active weekly goal to fold into.' }

  const snapshot = await buildLensGoalSnapshot(goal.id, player.id, 'attach_snapshot')
  await db.customBar.update({
    where: { id: quest.id },
    data: { lensGoalId: goal.id, plantSnapshot: snapshot ?? undefined, shadowAcknowledgedAt: null },
  })

  revalidatePath('/vault/shadow')
  revalidatePath('/vault/all')
  revalidatePath(`/bars/${quest.id}`)
  return { aligned: true }
}

/** Knowingly keep a quest out of alignment (a surfaced shadow, not a forgotten one). */
export async function acknowledgeShadowQuest(questId: string): Promise<{ shadowAcknowledgedAt: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const quest = await db.customBar.findFirst({
    where: { id: questId, creatorId: player.id, type: 'quest' },
    select: { id: true },
  })
  if (!quest) return { error: 'Quest not found' }

  const now = new Date()
  await db.customBar.update({ where: { id: quest.id }, data: { shadowAcknowledgedAt: now } })
  revalidatePath('/vault/shadow')
  revalidatePath(`/bars/${quest.id}`)
  return { shadowAcknowledgedAt: now.toISOString() }
}

// ── Goal rollup (display-only) ───────────────────────────────────────────────

export type GoalRollupNode = {
  id: string
  title: string
  domain: string
  cadence: string
  parentGoalId: string | null
  directQuests: number
  totalQuests: number
}

/**
 * Per active goal: quests hanging directly on it + the total rolled up from all
 * descendant goals (week→month→quarter→year). Display-only; no auto-completion.
 */
export async function getGoalRollup(): Promise<{ nodes: GoalRollupNode[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const goals = await db.lensGoal.findMany({
    where: { playerId: player.id, status: 'active' },
    select: { id: true, title: true, domain: true, cadence: true, parentGoalId: true },
  })
  if (goals.length === 0) return { nodes: [] }

  const grouped = await db.customBar.groupBy({
    by: ['lensGoalId'],
    where: {
      creatorId: player.id,
      type: 'quest',
      status: 'active',
      archivedAt: null,
      lensGoalId: { in: goals.map((g) => g.id) },
    },
    _count: { _all: true },
  })
  const directById = new Map(grouped.map((r) => [r.lensGoalId as string, r._count._all]))

  // children index for roll-up
  const childrenOf = new Map<string, string[]>()
  for (const g of goals) {
    if (g.parentGoalId) {
      const arr = childrenOf.get(g.parentGoalId) ?? []
      arr.push(g.id)
      childrenOf.set(g.parentGoalId, arr)
    }
  }

  // bounded DFS (cadence tree is ≤4 deep; guard against cycles)
  const totalCache = new Map<string, number>()
  const rollUp = (id: string, seen: Set<string>): number => {
    if (totalCache.has(id)) return totalCache.get(id)!
    if (seen.has(id)) return 0
    seen.add(id)
    let total = directById.get(id) ?? 0
    for (const child of childrenOf.get(id) ?? []) total += rollUp(child, seen)
    totalCache.set(id, total)
    return total
  }

  const nodes: GoalRollupNode[] = goals.map((g) => ({
    id: g.id,
    title: g.title,
    domain: g.domain,
    cadence: g.cadence,
    parentGoalId: g.parentGoalId,
    directQuests: directById.get(g.id) ?? 0,
    totalQuests: rollUp(g.id, new Set()),
  }))

  return { nodes }
}
