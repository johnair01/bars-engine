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
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { growQuestFromBar } from '@/actions/bars'
import { ensureTodayLens } from '@/lib/lenses/ensure'
import { addBarToHandForPlayer, type OverflowContext } from '@/lib/hand-service'
import { writePlantTriadToBar } from '@/lib/garden/plant'

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
  task: { id: string; barId: string | null; originalText: string },
): Promise<string | null> {
  if (task.barId) return task.barId
  try {
    return await createBarFromText(playerId, task.originalText, task.id)
  } catch (e) {
    console.error('[ttv:ensureBarForTask]', e)
    return null
  }
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
  completedAt: string | null
  createdAt: string
}

export type TtvToday = {
  sessionId: string
  sessionDate: string
  status: string
  rawEntry: string
  wordCount: number
  committedTaskCount: number
  tasks: TtvTaskDTO[]
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
  completedAt: Date | null
  createdAt: Date
}): TtvTaskDTO {
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

  // Carried tasks float to the top, then by creation order.
  const tasks = session.tasks
    .map(toTaskDTO)
    .sort((a, b) => Number(b.isCarried) - Number(a.isCarried))

  return {
    sessionId: session.id,
    sessionDate: startOfDay(session.sessionDate).toISOString().slice(0, 10),
    status: session.status,
    rawEntry: session.rawEntry,
    wordCount: session.wordCount,
    committedTaskCount: session.committedTaskCount,
    tasks,
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
}): Promise<TtvResult<{ task: TtvTaskDTO; barId: string; placedIn: 'hand' | 'vault'; overflow?: OverflowContext }>> {
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

    // "Up to 5 tasks/day" — count everything not composted.
    const liveCount = await db.tapTheVeinTask.count({
      where: { dailySessionId: session.id, status: { not: 'composted' } },
    })
    if (liveCount >= MAX_TASKS_PER_DAY) {
      return { error: `Daily cap reached (${MAX_TASKS_PER_DAY} tasks). Compost one to make room.` }
    }

    const created = await db.tapTheVeinTask.create({
      data: {
        playerId: player.id,
        dailySessionId: session.id,
        originalText: text,
        source: 'brainstorm',
        lensLevel: input.lensLevel ?? null,
        lensCategory: input.lensCategory ?? null,
        lensFaceKey: input.lensFaceKey ?? null,
      },
      select: TASK_SELECT,
    })

    await db.tapTheVeinDailySession.update({
      where: { id: session.id },
      data: { committedTaskCount: { increment: 1 } },
    })

    // A committed move is a real seed: mint its BAR now and deal it into the
    // Hand so the loop is visible (Hand + Vault). If the Hand is full, the BAR
    // still exists and waits in the Vault (graceful fallback, mirrors captureBar).
    const barId = await ensureBarForTask(player.id, created)
    let placedIn: 'hand' | 'vault' = 'vault'
    let overflow: OverflowContext | undefined
    if (barId) {
      const handRes = await addBarToHandForPlayer(player.id, barId)
      if ('success' in handRes && handRes.success) {
        placedIn = 'hand'
      } else if ('overflow' in handRes) {
        overflow = handRes.overflow
      }
    }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    revalidatePath('/')
    // ensureBarForTask linked task.barId in the DB after `created` was read — reflect it.
    return { task: toTaskDTO({ ...created, barId: barId ?? created.barId }), barId: barId ?? '', placedIn, overflow }
  } catch (e) {
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
      select: { id: true, playerId: true, status: true, barId: true },
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

    // Lifecycle sync (H1): composting a task composts its projected BAR too —
    // archive it (composted, not deleted: "nothing wasted") and free its Hand
    // slot so a composted move doesn't leave a stale card in the Hand.
    if (input.status === 'composted' && task.barId) {
      try {
        await db.customBar.update({
          where: { id: task.barId },
          data: {
            archivedAt: new Date(),
            seedMetabolization: mergeSeedMetabolization(TTV_BAR_SEED_METABOLIZATION, {
              compostedAt: new Date().toISOString(),
              releaseNote: input.compostReason ?? null,
            }),
          },
        })
        await db.handSlot.updateMany({
          where: { playerId: player.id, barId: task.barId },
          data: { barId: null, isCarrying: false },
        })
      } catch (e) {
        console.error('[ttv:updateTaskStatus] BAR compost sync failed', e)
      }
    }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    return { task: toTaskDTO(updated) }
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
export async function promoteTaskToBar(taskId: string): Promise<TtvResult<{ barId: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: taskId },
      select: { id: true, playerId: true, barId: true, originalText: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    const barId = await ensureBarForTask(player.id, task)
    if (!barId) return { error: 'Failed to plant task as a BAR' }

    revalidatePath('/tap-the-vein')
    revalidatePath('/vault')
    return { barId }
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
}): Promise<TtvResult<{ barId: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const experienceIntent = (input.experienceIntent || '').trim()
  if (!experienceIntent) return { error: 'Name the desired outcome' }
  if (!input.dissatisfaction?.length) return { error: 'Name the current dissatisfaction' }
  if (!input.satisfaction?.length) return { error: 'Name the desired satisfaction' }

  try {
    const task = await db.tapTheVeinTask.findUnique({
      where: { id: input.taskId },
      select: { id: true, playerId: true, barId: true, originalText: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

    const barId = await ensureBarForTask(player.id, task)
    if (!barId) return { error: 'Failed to plant task' }

    await writePlantTriadToBar(player.id, barId, {
      experienceIntent,
      dissatisfaction: input.dissatisfaction,
      satisfaction: input.satisfaction,
    })

    revalidatePath('/tap-the-vein')
    revalidatePath('/garden')
    return { barId }
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
      select: { id: true, playerId: true, status: true, barId: true, originalText: true },
    })
    if (!task) return { error: 'Task not found' }
    if (task.playerId !== player.id) return { error: 'Forbidden' }

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
    return { task: toTaskDTO(updated) }
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
