'use server'

/**
 * Tap the Vein — Layer A data layer (server actions over the PR #138 models).
 *
 * TTV is the daily morning ritual: free-write the day's charge, then commit up
 * to 5 tasks and move each through its lifecycle. This file is the engineering
 * seam the designed UI plugs into — see:
 *   docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md   (visual/UX spec)
 *   docs/plans/2026-06-24-tap-the-vein-placement-plan.md   (where it lives)
 *
 * Models: TapTheVeinDailySession + TapTheVeinTask (prisma/schema.prisma).
 * Auth: cookie-based getCurrentPlayer(); every read/write scoped to playerId.
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { MAX_TASKS_PER_DAY } from '@/lib/tap-the-vein/constants'
import { isLensDomainKey } from '@/lib/lenses/domains'
import { buildLensGoalSnapshot, resolveLensGoalTrace } from '@/lib/lenses/lineage'
import type { LensGoalTrace } from '@/lib/lenses/lineage-types'
import { ACTIVE_TTV_TASK_STATUSES, canCommitTtvTask, nextHistoricalPriorityRank } from '@/lib/tap-the-vein/commit-policy'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { growQuestFromBar } from '@/actions/bars'
import { ensureTodayLens } from '@/lib/lenses/ensure'
import { addBarToHandForPlayer, type OverflowContext } from '@/lib/hand-service'
import { writePlantTriadToBar } from '@/lib/garden/plant'
import { mintQuestFromText } from '@/lib/quests/mint'

/** Maturity/provenance for a TTV task's projected BAR (mirrors captureBar). */
const TTV_BAR_SEED_METABOLIZATION = mergeSeedMetabolization(null, {
  maturity: 'captured',
  soilKind: 'holding_pen',
})

/**
 * CGLA H1 (lazy) — promote a task into a CustomBar so it joins the core loop
 * (tune / charge / 3·2·1 / grow). **Idempotent + atomic**: returns the existing
 * barId if already promoted, else creates the BAR and links it in one transaction.
 *
 * BARs are minted by a deliberate gesture (keep / plant / upgrade), NOT on every
 * commit — this keeps the Vault from flooding with micro-task BARs and avoids
 * task↔BAR drift (decided via the Six GM panel; reverses the eager H1).
 */
/**
 * Mint a self-rooted, private CustomBar from free text, attached to today's lens
 * with the TTV "captured" seed provenance. Optionally links it back to a TTV task
 * (`linkTaskId`) in the same transaction. Shared by the in-ritual Plant gesture
 * and the standalone (no-task) 3·2·1 flow. Returns the new barId.
 */
async function createBarFromText(
  playerId: string,
  text: string,
  linkTaskId?: string,
  lineage?: { lensGoalId: string | null; plantSnapshot: LensGoalTrace | null },
): Promise<string> {
  const title = text.length <= 80 ? text : text.slice(0, 77) + '...'
  // Attach the BAR to today's lens (LENS first slice; best-effort).
  const lens = await ensureTodayLens(playerId)
  return await db.$transaction(async (tx) => {
    const bar = await tx.customBar.create({
      data: {
        creatorId: playerId,
        title: title || 'Untitled',
        description: text,
        type: 'bar',
        reward: 0,
        visibility: 'private',
        status: 'active',
        inputs: '[]',
        rootId: 'temp',
        lensId: lens?.id ?? null,
        lensGoalId: lineage?.lensGoalId ?? null,
        plantSnapshot: lineage?.plantSnapshot ?? undefined,
        seedMetabolization: TTV_BAR_SEED_METABOLIZATION,
      },
      select: { id: true },
    })
    await tx.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
    if (linkTaskId) {
      await tx.tapTheVeinTask.update({ where: { id: linkTaskId }, data: { barId: bar.id } })
    }
    return bar.id
  })
}

async function ensureBarForTask(
  playerId: string,
  task: { id: string; barId: string | null; originalText: string; lensGoalId?: string | null; attachSnapshot?: unknown },
): Promise<string | null> {
  if (task.barId) return task.barId
  try {
    const plantSnapshot = task.lensGoalId
      ? (await buildLensGoalSnapshot(task.lensGoalId, playerId, 'plant_snapshot')) ?? (await resolveLensGoalTrace({ playerId, attachSnapshot: task.attachSnapshot }))
      : null
    if (task.lensGoalId && !plantSnapshot) return null
    return await createBarFromText(playerId, task.originalText, task.id, {
      lensGoalId: task.lensGoalId ?? null,
      plantSnapshot,
    })
  } catch (e) {
    console.error('[ttv:ensureBarForTask]', e)
    return null
  }
}

/**
 * The CustomBar a task's gestures (keep / plant) should act on. Since QLA, a
 * committed task is **born as a quest** — its artifact is `task.questId`. Prefer
 * that; fall back to a legacy projected BAR (`task.barId`); only mint a BAR for
 * pre-QLA tasks that have neither. This is what stops keep/plant from re-minting
 * a second, disconnected BAR beside the quest.
 */
async function artifactIdForTask(
  playerId: string,
  task: { id: string; questId: string | null; barId: string | null; originalText: string; lensGoalId?: string | null; attachSnapshot?: unknown },
): Promise<string | null> {
  if (task.questId) return task.questId
  if (task.barId) return task.barId
  return ensureBarForTask(playerId, task)
}

/** Lifecycle: committed → in_progress → (terminal exit states). Player is the authority. */
const EXIT_STATES = new Set([
  'completed',
  'carried_over',
  'composted',
  'assigned_to_campaign',
  'upgraded_to_quest',
])
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  committed: new Set(['in_progress', ...EXIT_STATES]),
  in_progress: new Set([...EXIT_STATES]),
  // Exit states are terminal — no outbound transitions (carry clones a fresh task instead).
}

const COMPOST_REASONS = new Set([
  'not_relevant',
  'already_done',
  'assigned_elsewhere',
  'too_small',
  'too_big',
  'other',
])

export type TtvTaskDTO = {
  id: string
  text: string
  status: string
  carryCount: number
  isCarried: boolean
  compostReason: string | null
  campaignId: string | null
  visibility: string | null
  questId: string | null
  barId: string | null
  lensGoalId: string | null
  lensGoalTitle: string | null
  lensGoalDomain: string | null
  lensGoalTrace: LensGoalTrace | null
  priorityRank: number | null
  completedAt: string | null
  createdAt: string
}

export type TtvLensGoalOption = {
  id: string
  title: string
  domain: string
  cadence: string
  parentGoalId: string | null
}

export type TtvToday = {
  sessionId: string
  sessionDate: string
  status: string
  rawEntry: string
  wordCount: number
  committedTaskCount: number
  tasks: TtvTaskDTO[]
  lensGoals: TtvLensGoalOption[]
}

export type TtvResult<T> = T | { error: string }

/** Local start-of-day, matching the convention used elsewhere (e.g. /adventures). */
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
  return goals.filter((goal) => isLensDomainKey(goal.domain))
}

function toTaskDTO(t: {
  id: string
  originalText: string
  status: string
  carryCount: number
  carriedFromDailySessionId: string | null
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
}, goalById: Map<string, TtvLensGoalOption>, lensGoalTrace: LensGoalTrace | null): TtvTaskDTO {
  const goal = t.lensGoalId ? goalById.get(t.lensGoalId) : null
  return {
    id: t.id,
    text: t.originalText,
    status: t.status,
    carryCount: t.carryCount,
    isCarried: !!t.carriedFromDailySessionId || t.carryCount > 0,
    compostReason: t.compostReason,
    campaignId: t.campaignId,
    visibility: t.visibility,
    questId: t.questId,
    barId: t.barId,
    lensGoalId: t.lensGoalId,
    lensGoalTitle: goal?.title ?? null,
    lensGoalDomain: goal?.domain ?? null,
    lensGoalTrace,
    priorityRank: t.priorityRank,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }
}

const TASK_SELECT = {
  id: true,
  originalText: true,
  status: true,
  carryCount: true,
  carriedFromDailySessionId: true,
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
} as const

/** Get-or-create the player's session for a given day, returning the serialized view. */
async function loadOrCreateSession(playerId: string, sessionDate: Date): Promise<TtvToday> {
  const existing = await db.tapTheVeinDailySession.findUnique({
    where: { playerId_sessionDate: { playerId, sessionDate } },
    include: { tasks: { select: TASK_SELECT, orderBy: { createdAt: 'asc' } } },
  })

  const session =
    existing ??
    (await db.tapTheVeinDailySession.create({
      // rawEntry + wordCount are non-null in the schema; seed empty.
      data: { playerId, sessionDate, rawEntry: '', wordCount: 0 },
      include: { tasks: { select: TASK_SELECT, orderBy: { createdAt: 'asc' } } },
    }))

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
  tasks.sort((a, b) => Number(b.isCarried) - Number(a.isCarried))

  return {
    sessionId: session.id,
    sessionDate: startOfDay(session.sessionDate).toISOString().slice(0, 10),
    status: session.status,
    rawEntry: session.rawEntry,
    wordCount: session.wordCount,
    committedTaskCount: session.committedTaskCount,
    tasks,
    lensGoals,
  }
}

/** Today's ritual — get-or-create and return it. The page loads this. */
export async function getToday(): Promise<TtvResult<TtvToday>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    return await loadOrCreateSession(player.id, startOfDay())
  } catch (e) {
    console.error('[ttv:getToday]', e)
    return { error: 'Failed to load today’s ritual' }
  }
}

/** Phase B — persist the free-write + recompute word count. */
export async function saveBrainstorm(rawEntry: string): Promise<TtvResult<{ wordCount: number }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const wordCount = countWords(rawEntry)
    await db.tapTheVeinDailySession.update({
      where: { playerId_sessionDate: { playerId: player.id, sessionDate: startOfDay() } },
      data: { rawEntry, wordCount },
    })
    revalidatePath('/tap-the-vein')
    return { wordCount }
  } catch (e) {
    console.error('[ttv:saveBrainstorm]', e)
    return { error: 'Failed to save' }
  }
}

/** Phase C — commit a task (raw → seed). Caps at MAX_TASKS_PER_DAY active. */
export async function commitTask(input: {
  text: string
  lensLevel?: string | null
  lensCategory?: string | null
  lensFaceKey?: string | null
  lensGoalId?: string | null
}): Promise<TtvResult<{ task: TtvTaskDTO; questId: string; aligned: boolean; placedIn: 'hand' | 'vault'; overflow?: OverflowContext }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const text = (input.text || '').trim()
  if (!text) return { error: 'Add a line to commit' }

  try {
    const session = await db.tapTheVeinDailySession.findUnique({
      where: { playerId_sessionDate: { playerId: player.id, sessionDate: startOfDay() } },
      select: { id: true },
    })
    if (!session) return { error: 'No open session — reload the page' }

    let lensGoal: { id: string; domain: string; cadence: string } | null = null
    let attachSnapshot: LensGoalTrace | null = null
    if (input.lensGoalId) {
      lensGoal = await db.lensGoal.findFirst({
        where: { id: input.lensGoalId, playerId: player.id, status: 'active' },
        select: { id: true, domain: true, cadence: true },
      })
      if (!lensGoal) return { error: 'That lens goal is no longer active.' }
      attachSnapshot = await buildLensGoalSnapshot(lensGoal.id, player.id, 'attach_snapshot')
      if (!attachSnapshot) return { error: 'That lens goal thread could not be traced. Reattach the task before keeping it.' }
    }

    const created = await db.$transaction(async (tx) => {
      const liveCount = await tx.tapTheVeinTask.count({
        where: { dailySessionId: session.id, status: { in: [...ACTIVE_TTV_TASK_STATUSES] } },
      })
      if (!canCommitTtvTask(liveCount, MAX_TASKS_PER_DAY)) {
        throw new Error('TTV_CAP_REACHED')
      }
      const maxRank = await tx.tapTheVeinTask.aggregate({
        where: { dailySessionId: session.id },
        _max: { priorityRank: true },
      })
      const task = await tx.tapTheVeinTask.create({
        data: {
          playerId: player.id,
          dailySessionId: session.id,
          originalText: text,
          source: 'brainstorm',
          lensLevel: lensGoal?.cadence ?? input.lensLevel ?? null,
          lensCategory: lensGoal?.domain ?? input.lensCategory ?? null,
          lensFaceKey: input.lensFaceKey ?? null,
          lensGoalId: lensGoal?.id ?? null,
          attachSnapshot: attachSnapshot ?? undefined,
          priorityRank: nextHistoricalPriorityRank(maxRank._max.priorityRank),
        },
        select: TASK_SELECT,
      })
      await tx.tapTheVeinDailySession.update({
        where: { id: session.id },
        data: { committedTaskCount: liveCount + 1 },
      })
      return task
    })

    const lensGoals = await listActiveLensGoals(player.id)
    const goalById = new Map(lensGoals.map((goal) => [goal.id, goal]))
    const lensGoalTrace = await resolveLensGoalTrace({
      playerId: player.id,
      lensGoalId: created.lensGoalId,
      attachSnapshot: created.attachSnapshot,
    })

    // Born as a quest (QLA): a committed move IS a quest from the jump, carrying
    // its lens lineage. Aligned when it hangs on a weekly goal; otherwise it is a
    // shadow quest surfaced for fold-in. Deal it into the Hand (Vault on overflow).
    const lens = await ensureTodayLens(player.id)
    const { questId } = await mintQuestFromText({
      playerId: player.id,
      title: text,
      description: text,
      sourceTaskId: created.id,
      questSource: 'tap_the_vein',
      lensId: lens?.id ?? null,
      lensGoalId: lensGoal?.id ?? null,
      plantSnapshot: attachSnapshot,
    })
    const aligned = lensGoal?.cadence === 'week'

    let placedIn: 'hand' | 'vault' = 'vault'
    let overflow: OverflowContext | undefined
    const handRes = await addBarToHandForPlayer(player.id, questId)
    if ('success' in handRes && handRes.success) {
      placedIn = 'hand'
    } else if ('overflow' in handRes) {
      overflow = handRes.overflow
    }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    revalidatePath('/')
    // mintQuestFromText set task.questId after `created` was read — reflect it.
    return {
      task: toTaskDTO({ ...created, questId }, goalById, lensGoalTrace),
      questId,
      aligned,
      placedIn,
      overflow,
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'TTV_CAP_REACHED') {
      return { error: `Daily cap reached (${MAX_TASKS_PER_DAY} tasks). Compost one to make room.` }
    }
    console.error('[ttv:commitTask]', e)
    return { error: 'Failed to commit task' }
  }
}

/** Phase D — lifecycle transition with validation + ownership. */
export async function updateTaskStatus(input: {
  taskId: string
  status: string
  compostReason?: string | null
  campaignId?: string | null
  visibility?: string | null
}): Promise<TtvResult<{ task: TtvTaskDTO }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: input.taskId },
      select: { id: true, playerId: true, status: true, barId: true, questId: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    const allowed = ALLOWED_TRANSITIONS[task.status]
    if (!allowed || !allowed.has(input.status)) {
      return { error: `Cannot move from ${task.status} to ${input.status}` }
    }

    const data: Record<string, unknown> = { status: input.status }
    if (input.status === 'completed') data.completedAt = new Date()
    if (input.status === 'composted') {
      if (!input.compostReason || !COMPOST_REASONS.has(input.compostReason)) {
        return { error: 'A compost reason is required' }
      }
      data.compostReason = input.compostReason
      data.compostedAt = new Date()
    }
    if (input.status === 'assigned_to_campaign') {
      if (!input.campaignId) return { error: 'A campaign is required' }
      data.campaignId = input.campaignId
      // Private by default; only share when explicitly opted in.
      data.visibility = input.visibility === 'campaign' ? 'campaign' : null
    }

    const updated = await db.tapTheVeinTask.update({
      where: { id: task.id },
      data,
      select: TASK_SELECT,
    })

    // Lifecycle sync: composting a task composts its artifact too — the born-as-quest
    // (task.questId) or a legacy projected BAR (task.barId). Archive it (composted, not
    // deleted: "nothing wasted") and free its Hand slot so no stale card lingers.
    const artifactId = task.questId ?? task.barId
    if (input.status === 'composted' && artifactId) {
      try {
        await db.customBar.update({
          where: { id: artifactId },
          data: {
            archivedAt: new Date(),
            seedMetabolization: mergeSeedMetabolization(TTV_BAR_SEED_METABOLIZATION, {
              compostedAt: new Date().toISOString(),
              releaseNote: input.compostReason ?? null,
            }),
          },
        })
        await db.handSlot.updateMany({
          where: { playerId: player.id, barId: artifactId },
          data: { barId: null, isCarrying: false },
        })
      } catch (e) {
        console.error('[ttv:updateTaskStatus] artifact compost sync failed', e)
      }
    }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    return { task: toTaskDTO(updated, new Map(), null) }
  } catch (e) {
    console.error('[ttv:updateTaskStatus]', e)
    return { error: 'Failed to update task' }
  }
}

/** Phase D — push a task to tomorrow: clone forward, mark the original carried_over. */
export async function carryTask(taskId: string): Promise<TtvResult<{ newSessionId: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        playerId: true,
        status: true,
        dailySessionId: true,
        originalText: true,
        carryCount: true,
        lensLevel: true,
        lensCategory: true,
        lensFaceKey: true,
        lensGoalId: true,
        attachSnapshot: true,
      },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }
    const allowed = ALLOWED_TRANSITIONS[task.status]
    if (!allowed || !allowed.has('carried_over')) {
      return { error: `Cannot carry a ${task.status} task` }
    }

    const tomorrow = startOfDay()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = await db.$transaction(async (tx) => {
      const next = await tx.tapTheVeinDailySession.upsert({
        where: { playerId_sessionDate: { playerId: player.id, sessionDate: tomorrow } },
        update: {},
        create: { playerId: player.id, sessionDate: tomorrow, rawEntry: '', wordCount: 0 },
        select: { id: true },
      })
      const maxRank = await tx.tapTheVeinTask.aggregate({
        where: { dailySessionId: next.id },
        _max: { priorityRank: true },
      })
      await tx.tapTheVeinTask.create({
        data: {
          playerId: player.id,
          dailySessionId: next.id,
          originalText: task.originalText,
          source: 'brainstorm',
          carriedFromDailySessionId: task.dailySessionId,
          carryCount: task.carryCount + 1,
          lensLevel: task.lensLevel,
          lensCategory: task.lensCategory,
          lensFaceKey: task.lensFaceKey,
          lensGoalId: task.lensGoalId,
          attachSnapshot: task.attachSnapshot ?? undefined,
          priorityRank: nextHistoricalPriorityRank(maxRank._max.priorityRank),
        },
      })
      await tx.tapTheVeinTask.update({
        where: { id: task.id },
        data: { status: 'carried_over' },
      })
      await tx.tapTheVeinDailySession.update({
        where: { id: next.id },
        data: { committedTaskCount: { increment: 1 } },
      })
      return next.id
    })

    revalidatePath('/tap-the-vein')
    return { newSessionId: result }
  } catch (e) {
    console.error('[ttv:carryTask]', e)
    return { error: 'Failed to carry task' }
  }
}

/**
 * Keep/plant gesture (CGLA H1, lazy) — promote a task into a BAR so it joins the
 * core loop. Idempotent; returns the (existing or new) barId.
 */
type PromoteTaskToBarResult = { error: string } | { barId: string; plantSnapshot: unknown | null }

export async function promoteTaskToBar(taskId: string): Promise<PromoteTaskToBarResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: taskId },
      select: { id: true, playerId: true, questId: true, barId: true, originalText: true, lensGoalId: true, attachSnapshot: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    // Born-as-quest: the artifact already exists (the quest). Return it instead of
    // minting a second, disconnected BAR. Legacy tasks fall back to a projected BAR.
    const barId = await artifactIdForTask(player.id, task)
    if (!barId) return { error: 'Failed to plant task as a BAR' }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    const bar = await db.customBar.findFirst({ where: { id: barId, creatorId: player.id }, select: { plantSnapshot: true } })
    return { barId, plantSnapshot: bar?.plantSnapshot ?? null }
  } catch (e) {
    console.error('[ttv:promoteTaskToBar]', e)
    return { error: 'Failed to plant task' }
  }
}

/**
 * Plant gesture (LENS) — promote the task to a BAR (if needed), capture the
 * **EA triad** (desired outcome + current dissatisfaction + desired satisfaction;
 * load-bearing for lens/campaign alignment + EA moves), and place it in the
 * player's Garden (set gardenId). The BAR already carries today's lensId. Idempotent.
 */
export async function plantTask(input: {
  taskId: string
  experienceIntent: string
  dissatisfaction: string[]
  satisfaction: string[]
}): Promise<TtvResult<{ barId: string; plantSnapshot: LensGoalTrace | null }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const experienceIntent = (input.experienceIntent || '').trim()
  if (!experienceIntent) return { error: 'Name the desired outcome' }
  if (!input.dissatisfaction?.length) return { error: 'Name the current dissatisfaction' }
  if (!input.satisfaction?.length) return { error: 'Name the desired satisfaction' }

  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: input.taskId },
      select: { id: true, playerId: true, questId: true, barId: true, originalText: true, lensGoalId: true, attachSnapshot: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    // Plant the task's existing artifact (the born-as-quest) — do not mint a
    // second BAR. Writes the EA triad + gardenId onto the quest itself.
    const barId = await artifactIdForTask(player.id, task)
    if (!barId) return { error: 'Failed to plant task' }

    await writePlantTriadToBar(player.id, barId, {
      experienceIntent,
      dissatisfaction: input.dissatisfaction,
      satisfaction: input.satisfaction,
    })

    revalidatePath('/tap-the-vein')
    revalidatePath('/garden')
    const bar = await db.customBar.findFirst({ where: { id: barId, creatorId: player.id }, select: { plantSnapshot: true } })
    return { barId, plantSnapshot: bar?.plantSnapshot && typeof bar.plantSnapshot === 'object' ? (bar.plantSnapshot as LensGoalTrace) : null }
  } catch (e) {
    console.error('[ttv:plantTask]', e)
    return { error: 'Failed to plant task' }
  }
}

/**
 * Phase D — upgrade a task to a real Quest (CGLA H1).
 * Lazily promotes the task to a BAR if needed, grows a quest from it via the
 * existing `growQuestFromBar`, then records the transition + questId.
 */
export async function upgradeTaskToQuest(taskId: string): Promise<TtvResult<{ task: TtvTaskDTO }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: taskId },
      select: { id: true, playerId: true, status: true, barId: true, questId: true, originalText: true, lensGoalId: true, attachSnapshot: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    // Born-as-quest (QLA): the task already has a quest — idempotent no-op, never
    // double-mint. Return the task unchanged so it stays in the day's work list.
    if (task.questId) {
      const existing = await db.tapTheVeinTask.findUnique({ where: { id: task.id }, select: TASK_SELECT })
      return { task: toTaskDTO(existing!, new Map(), null) }
    }

    const allowed = ALLOWED_TRANSITIONS[task.status]
    if (!allowed || !allowed.has('upgraded_to_quest')) {
      return { error: `Cannot upgrade a ${task.status} task` }
    }

    // Lazy promotion: mint the BAR now if this task doesn't have one yet.
    const barId = await ensureBarForTask(player.id, task)
    if (!barId) return { error: 'Could not prepare a BAR to grow from' }

    const res = await growQuestFromBar(barId)
    if (res.error) return { error: res.error }
    const questId = res.questId ?? null

    const updated = await db.tapTheVeinTask.update({
      where: { id: task.id },
      data: { status: 'upgraded_to_quest', questId },
      select: TASK_SELECT,
    })
    revalidatePath('/tap-the-vein')
    return { task: toTaskDTO(updated, new Map(), null) }
  } catch (e) {
    console.error('[ttv:upgradeTaskToQuest]', e)
    return { error: 'Failed to upgrade task' }
  }
}

/**
 * Read-only summary for the NOW-hub panel. Does NOT create a session
 * (viewing the home screen must not start the ritual).
 */
export type TtvPanelSummary = {
  status: 'not_started' | 'in_progress' | 'sealed'
  setForToday: number // committed/in_progress/completed/assigned/upgraded — excludes composted + carried_over
  carried: number // carried-in, still live
  completed: number
  sealedAt: string | null
}

export async function getTodayPanelSummary(): Promise<TtvResult<TtvPanelSummary>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const session = await db.tapTheVeinDailySession.findUnique({
      where: { playerId_sessionDate: { playerId: player.id, sessionDate: startOfDay() } },
      select: {
        status: true,
        rawEntry: true,
        sealedAt: true,
        tasks: { select: { status: true, carryCount: true, carriedFromDailySessionId: true } },
      },
    })

    if (!session) {
      return { status: 'not_started', setForToday: 0, carried: 0, completed: 0, sealedAt: null }
    }

    const setForToday = session.tasks.filter(
      (t) => t.status !== 'composted' && t.status !== 'carried_over',
    ).length
    const carried = session.tasks.filter(
      (t) => t.status !== 'composted' && t.status !== 'carried_over' && (t.carryCount > 0 || !!t.carriedFromDailySessionId),
    ).length
    const completed = session.tasks.filter((t) => t.status === 'completed').length

    if (session.status === 'sealed') {
      return { status: 'sealed', setForToday, carried, completed, sealedAt: session.sealedAt?.toISOString() ?? null }
    }

    // Open but untouched (no tasks, empty free-write) reads as "not started" to the player.
    const hasActivity = setForToday > 0 || session.rawEntry.trim().length > 0
    return {
      status: hasActivity ? 'in_progress' : 'not_started',
      setForToday,
      carried,
      completed,
      sealedAt: null,
    }
  } catch (e) {
    console.error('[ttv:getTodayPanelSummary]', e)
    return { error: 'Failed to load summary' }
  }
}

/** Campaigns the player can assign a task to (read-only; from instance memberships). */
export type TtvCampaignOption = { id: string; name: string }

export async function listPlayerCampaigns(): Promise<TtvResult<{ campaigns: TtvCampaignOption[] }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const memberships = await db.instanceMembership.findMany({
      where: { playerId: player.id },
      select: { instance: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const seen = new Set<string>()
    const campaigns: TtvCampaignOption[] = []
    for (const m of memberships) {
      if (m.instance && !seen.has(m.instance.id)) {
        seen.add(m.instance.id)
        campaigns.push({ id: m.instance.id, name: m.instance.name })
      }
    }
    return { campaigns }
  } catch (e) {
    console.error('[ttv:listPlayerCampaigns]', e)
    return { error: 'Failed to load campaigns' }
  }
}

/** Phase E — seal the day. */
export async function sealSession(): Promise<TtvResult<{ status: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    await db.tapTheVeinDailySession.update({
      where: { playerId_sessionDate: { playerId: player.id, sessionDate: startOfDay() } },
      data: { status: 'sealed', sealedAt: new Date() },
    })
    revalidatePath('/tap-the-vein')
    revalidatePath('/')
    return { status: 'sealed' }
  } catch (e) {
    console.error('[ttv:sealSession]', e)
    return { error: 'Failed to seal session' }
  }
}
