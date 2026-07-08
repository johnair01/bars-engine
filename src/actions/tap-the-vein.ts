'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { MAX_TASKS_PER_DAY } from '@/lib/tap-the-vein/constants'
import { isLensDomainKey } from '@/lib/lenses/domains'
import { buildLensGoalSnapshot, resolveLensGoalTrace } from '@/lib/lenses/lineage'
import type { LensGoalTrace } from '@/lib/lenses/lineage-types'
import { ensureCadenceLens } from '@/lib/lenses/onboarding-data'
import { ACTIVE_TTV_TASK_STATUSES, canCommitTtvTask, nextHistoricalPriorityRank } from '@/lib/tap-the-vein/commit-policy'
import type { TtvLensGoalOption, TtvTaskDTO, TtvToday } from '@/lib/tap-the-vein/types'

function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

async function listActiveLensGoals(playerId: string): Promise<TtvLensGoalOption[]> {
  const goals = await db.lensGoal.findMany({
    where: { playerId, status: 'active', cadence: { in: ['week', 'month', 'quarter', 'year'] } },
    orderBy: [{ cadence: 'asc' }, { domain: 'asc' }, { keepOrder: 'asc' }],
    select: { id: true, title: true, domain: true, cadence: true, parentGoalId: true },
  })
  return goals.flatMap((goal) => {
    if (!isLensDomainKey(goal.domain)) return []
    return [{ ...goal, domain: goal.domain }]
  })
}

function toTaskDTO(
  task: {
    id: string
    originalText: string
    status: string
    carryCount: number
    compostReason: string | null
    campaignId: string | null
    visibility: string | null
    questId: string | null
    barId: string | null
    lensGoalId: string | null
    attachSnapshot?: unknown
    priorityRank: number | null
    completedAt: Date | null
    createdAt: Date
  },
  goalById: Map<string, TtvLensGoalOption>,
  lensGoalTrace: LensGoalTrace | null,
): TtvTaskDTO {
  const goal = task.lensGoalId ? goalById.get(task.lensGoalId) : null
  return {
    id: task.id,
    text: task.originalText,
    status: task.status,
    carryCount: task.carryCount,
    compostReason: task.compostReason,
    campaignId: task.campaignId,
    visibility: task.visibility,
    questId: task.questId,
    barId: task.barId,
    lensGoalId: task.lensGoalId,
    lensGoalTitle: goal?.title ?? null,
    lensGoalDomain: goal?.domain ?? null,
    lensGoalTrace,
    priorityRank: task.priorityRank,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
  }
}

async function loadOrCreateToday(playerId: string): Promise<TtvToday> {
  const sessionDate = startOfDay()
  const session = await db.tapTheVeinDailySession.upsert({
    where: { playerId_sessionDate: { playerId, sessionDate } },
    update: {},
    create: { playerId, sessionDate, rawEntry: '', wordCount: 0 },
    include: {
      tasks: {
        orderBy: [{ priorityRank: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          originalText: true,
          status: true,
          carryCount: true,
          compostReason: true,
          campaignId: true,
          visibility: true,
          questId: true,
          barId: true,
          lensGoalId: true,
          attachSnapshot: true,
          priorityRank: true,
          completedAt: true,
          createdAt: true,
        },
      },
    },
  })

  const lensGoals = await listActiveLensGoals(playerId)
  const goalById = new Map(lensGoals.map((goal) => [goal.id, goal]))

  const tasks: TtvTaskDTO[] = []
  for (const task of session.tasks) {
    const lensGoalTrace = await resolveLensGoalTrace({
      playerId,
      lensGoalId: task.lensGoalId,
      attachSnapshot: task.attachSnapshot,
    })
    tasks.push(toTaskDTO(task, goalById, lensGoalTrace))
  }

  return {
    sessionId: session.id,
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    status: session.status,
    rawEntry: session.rawEntry,
    wordCount: session.wordCount,
    committedTaskCount: session.committedTaskCount,
    tasks,
    lensGoals,
  }
}

export async function getToday() {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  return loadOrCreateToday(player.id)
}

export async function saveBrainstorm(rawEntry: string) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const sessionDate = startOfDay()
  const wordCount = countWords(rawEntry)
  await db.tapTheVeinDailySession.upsert({
    where: { playerId_sessionDate: { playerId: player.id, sessionDate } },
    update: { rawEntry, wordCount },
    create: { playerId: player.id, sessionDate, rawEntry, wordCount },
  })
  revalidatePath('/tap-the-vein')
  return { wordCount }
}

export async function commitTask(input: { text: string; lensGoalId?: string | null }) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const text = input.text.trim()
  if (!text) return { error: 'Add a line to keep.' }

  const session = await db.tapTheVeinDailySession.upsert({
    where: { playerId_sessionDate: { playerId: player.id, sessionDate: startOfDay() } },
    update: {},
    create: { playerId: player.id, sessionDate: startOfDay(), rawEntry: '', wordCount: 0 },
    select: { id: true },
  })

  let lensGoal:
    | { id: string; lensId: string; domain: string; cadence: string; title: string }
    | null = null
  let attachSnapshot: Awaited<ReturnType<typeof buildLensGoalSnapshot>> = null
  if (input.lensGoalId) {
    lensGoal = await db.lensGoal.findFirst({
      where: { id: input.lensGoalId, playerId: player.id, status: 'active' },
      select: { id: true, lensId: true, domain: true, cadence: true, title: true },
    })
    if (!lensGoal) return { error: 'That lens goal is no longer active.' }
    attachSnapshot = await buildLensGoalSnapshot(lensGoal.id, player.id, 'attach_snapshot')
    if (!attachSnapshot) return { error: 'That lens goal thread could not be traced. Reattach the task before keeping it.' }
  }

  try {
    await db.$transaction(async (tx) => {
      const activeCount = await tx.tapTheVeinTask.count({
        where: {
          playerId: player.id,
          dailySessionId: session.id,
          status: { in: [...ACTIVE_TTV_TASK_STATUSES] },
        },
      })
      if (!canCommitTtvTask(activeCount, MAX_TASKS_PER_DAY)) throw new Error('TTV_CAP_REACHED')

      const maxRank = await tx.tapTheVeinTask.aggregate({
        where: { dailySessionId: session.id },
        _max: { priorityRank: true },
      })
      const priorityRank = nextHistoricalPriorityRank(maxRank._max.priorityRank)

      await tx.tapTheVeinTask.create({
        data: {
          playerId: player.id,
          dailySessionId: session.id,
          originalText: text,
          lensGoalId: lensGoal?.id ?? null,
          attachSnapshot: attachSnapshot ?? undefined,
          lensCategory: lensGoal?.domain ?? null,
          lifeLensDomain: lensGoal?.domain ?? null,
          lensLevel: lensGoal?.cadence ?? null,
          priorityRank,
        },
      })
      await tx.tapTheVeinDailySession.update({
        where: { id: session.id },
        data: { committedTaskCount: activeCount + 1 },
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'TTV_CAP_REACHED') {
      return { error: 'Keep five for today. Park the rest.' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'That task landed at the same moment as another one. Try keeping it once more.' }
    }
    throw error
  }

  revalidatePath('/tap-the-vein')
  return { ok: true }
}

export async function updateTaskStatus(input: { taskId: string; status: string; compostReason?: string | null }) {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const allowed = new Set(['committed', 'in_progress', 'completed', 'composted'])
  if (!allowed.has(input.status)) return { error: 'Unsupported task status.' }
  await db.tapTheVeinTask.updateMany({
    where: { id: input.taskId, playerId: player.id },
    data: {
      status: input.status,
      completedAt: input.status === 'completed' ? new Date() : null,
      compostReason: input.status === 'composted' ? input.compostReason ?? 'other' : null,
      compostedAt: input.status === 'composted' ? new Date() : null,
    },
  })
  revalidatePath('/tap-the-vein')
  return { ok: true }
}

type PromoteTaskToBarResult = { error: string } | { barId: string; plantSnapshot: unknown | null }

export async function promoteTaskToBar(taskId: string): Promise<PromoteTaskToBarResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const task = await db.tapTheVeinTask.findFirst({ where: { id: taskId, playerId: player.id } })
  if (!task) return { error: 'Task not found.' }
  if (task.barId) {
    const existingBar = await db.customBar.findFirst({
      where: { id: task.barId, creatorId: player.id },
      select: { id: true, plantSnapshot: true },
    })
    return { barId: task.barId, plantSnapshot: existingBar?.plantSnapshot ?? null }
  }

  const lensGoal = task.lensGoalId
    ? await db.lensGoal.findFirst({ where: { id: task.lensGoalId, playerId: player.id }, select: { id: true, lensId: true } })
    : null
  const plantSnapshot = task.lensGoalId
    ? (await buildLensGoalSnapshot(task.lensGoalId, player.id, 'plant_snapshot')) ?? task.attachSnapshot
    : null

  if (task.lensGoalId && !lensGoal && !plantSnapshot) {
    return { error: 'This task was attached to an older goal thread I can’t resolve. Reattach it to a Lens goal before planting.' }
  }

  const todayLens = await ensureCadenceLens(player.id, 'week')
  const lensId = lensGoal?.lensId ?? todayLens.id
  const title = task.originalText.length <= 80 ? task.originalText : `${task.originalText.slice(0, 77)}...`

  const bar = await db.$transaction(async (tx) => {
    const created = await tx.customBar.create({
      data: {
        creatorId: player.id,
        title: title || 'Tap the Vein task',
        description: task.originalText,
        type: 'bar',
        reward: 0,
        visibility: 'private',
        status: 'active',
        inputs: '[]',
        rootId: 'temp',
        lensId,
        lensGoalId: task.lensGoalId ?? null,
        plantSnapshot: plantSnapshot ?? undefined,
        gardenId: `personal:${player.id}`,
      },
      select: { id: true },
    })
    await tx.customBar.update({ where: { id: created.id }, data: { rootId: created.id } })
    await tx.tapTheVeinTask.update({ where: { id: task.id }, data: { barId: created.id } })
    return created
  })

  revalidatePath('/tap-the-vein')
  return { barId: bar.id, plantSnapshot: plantSnapshot ?? null }
}
