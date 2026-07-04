'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import type { ShadowReason } from '@/actions/quests'

export type WeeklyClearItem = {
  id: string
  text: string
  carryCount: number
  compostReason: string | null
}

export type WeeklyOrphanQuest = {
  id: string
  title: string
}

export type WeeklyShadowQuest = {
  id: string
  title: string
  reason: ShadowReason
}

export type WeeklyLensGoalItem = {
  id: string
  title: string
  domain: string
  cadence: string
}

export type WeeklyReflectionSummary = {
  weekStartIso: string
  clear: {
    carried: WeeklyClearItem[]
    composted: WeeklyClearItem[]
  }
  current: {
    orphanQuests: WeeklyOrphanQuest[]
    shadowQuests: WeeklyShadowQuest[]
  }
  creative: {
    parkedGoals: WeeklyLensGoalItem[]
    activeWeeklyGoals: WeeklyLensGoalItem[]
  }
}

function startOfRollingWeek(d = new Date()): Date {
  const x = new Date(d)
  x.setDate(x.getDate() - 7)
  x.setHours(0, 0, 0, 0)
  return x
}

/** PMA B2.4 — three-beat weekly reflection data for Observatory week close. */
export async function getWeeklyReflectionSummary(): Promise<
  WeeklyReflectionSummary | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const weekStart = startOfRollingWeek()

  try {
    const [carriedTasks, compostedTasks, assignments, ownedQuests, parkedGoals, activeWeeklyGoals] =
      await Promise.all([
        db.tapTheVeinTask.findMany({
          where: {
            playerId: player.id,
            updatedAt: { gte: weekStart },
            OR: [{ carryCount: { gt: 0 } }, { carriedFromDailySessionId: { not: null } }],
          },
          orderBy: { updatedAt: 'desc' },
          take: 12,
          select: {
            id: true,
            originalText: true,
            carryCount: true,
            compostReason: true,
          },
        }),
        db.tapTheVeinTask.findMany({
          where: {
            playerId: player.id,
            status: 'composted',
            compostedAt: { gte: weekStart },
          },
          orderBy: { compostedAt: 'desc' },
          take: 12,
          select: {
            id: true,
            originalText: true,
            carryCount: true,
            compostReason: true,
          },
        }),
        db.playerQuest.findMany({
          where: { playerId: player.id, status: 'assigned' },
          include: {
            quest: {
              select: {
                id: true,
                title: true,
                nextActionBridgesAsQuest: { select: { nextAction: true } },
              },
            },
          },
          orderBy: { assignedAt: 'asc' },
        }),
        db.customBar.findMany({
          where: {
            creatorId: player.id,
            type: 'quest',
            status: 'active',
            archivedAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            title: true,
            lensGoalId: true,
            shadowAcknowledgedAt: true,
          },
        }),
        db.lensGoal.findMany({
          where: { playerId: player.id, status: 'parked' },
          orderBy: [{ cadence: 'asc' }, { domain: 'asc' }, { keepOrder: 'asc' }],
          select: { id: true, title: true, domain: true, cadence: true },
        }),
        db.lensGoal.findMany({
          where: { playerId: player.id, status: 'active', cadence: 'week' },
          orderBy: [{ domain: 'asc' }, { keepOrder: 'asc' }],
          select: { id: true, title: true, domain: true, cadence: true },
        }),
      ])

    const orphanQuests: WeeklyOrphanQuest[] = assignments
      .filter((a) => !a.quest.nextActionBridgesAsQuest?.nextAction?.trim())
      .map((a) => ({ id: a.quest.id, title: a.quest.title }))

    const goalIds = [
      ...new Set(ownedQuests.map((q) => q.lensGoalId).filter((x): x is string => !!x)),
    ]
    const goals = goalIds.length
      ? await db.lensGoal.findMany({
          where: { id: { in: goalIds }, playerId: player.id },
          select: { id: true, cadence: true, status: true },
        })
      : []
    const goalById = new Map(goals.map((g) => [g.id, g]))

    const shadowQuests: WeeklyShadowQuest[] = []
    for (const q of ownedQuests) {
      let reason: ShadowReason | null = null
      if (!q.lensGoalId) {
        reason = 'no_goal'
      } else {
        const g = goalById.get(q.lensGoalId)
        if (!g || g.status !== 'active') reason = 'goal_inactive'
        else if (g.cadence !== 'week') reason = 'not_weekly'
      }
      if (reason) {
        shadowQuests.push({ id: q.id, title: q.title, reason })
      }
    }

    return {
      weekStartIso: weekStart.toISOString(),
      clear: {
        carried: carriedTasks.map((t) => ({
          id: t.id,
          text: t.originalText,
          carryCount: t.carryCount,
          compostReason: t.compostReason,
        })),
        composted: compostedTasks.map((t) => ({
          id: t.id,
          text: t.originalText,
          carryCount: t.carryCount,
          compostReason: t.compostReason,
        })),
      },
      current: { orphanQuests, shadowQuests },
      creative: { parkedGoals, activeWeeklyGoals },
    }
  } catch (e) {
    console.error('[weekly-reflection:getWeeklyReflectionSummary]', e)
    return { error: 'Failed to load weekly reflection' }
  }
}

/** Resume a parked lens goal from the Creative beat. */
export async function resumeParkedLensGoal(
  goalId: string,
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const goal = await db.lensGoal.findFirst({
    where: { id: goalId, playerId: player.id, status: 'parked' },
    select: { id: true },
  })
  if (!goal) return { error: 'Goal not found or not parked' }

  await db.lensGoal.update({
    where: { id: goal.id },
    data: { status: 'active' },
  })

  revalidatePath('/observatory/weekly')
  revalidatePath('/lenses/descent')
  return { success: true }
}
