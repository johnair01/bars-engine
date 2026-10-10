'use server'

/**
 * Tap the Vein — the morning menu (TTV-MENU) server actions.
 *
 * After commit, his kept lines become a menu. Each item is bridged to a Lens
 * goal; an item with no goal shows a game master's suggestion that he accepts,
 * replaces with another goal, or declines. Sealing the menu freezes the copy the
 * council reads (GET /api/tap-the-vein/menu). The free write never leaves.
 *
 * Pure logic: src/lib/tap-the-vein/menu.ts. Spec: .specify/specs/tap-the-vein-morning-menu/.
 */

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { buildLensGoalSnapshot } from '@/lib/lenses/lineage'
import { ensureCadenceLens } from '@/lib/lenses/onboarding-data'
import { loadMenuForSession } from '@/lib/tap-the-vein/menu-data'
import { suggestBridge, toMenuExport, type MenuItem, type StoredMorningMenu } from '@/lib/tap-the-vein/menu'
import type { TtvLensGoalOption } from '@/lib/tap-the-vein/types'

type Result<T> = T | { error: string }

export type MorningMenuView = {
  sessionDate: string
  items: MenuItem[]
  /** Every active goal, for the "pick another goal" list. */
  goals: TtvLensGoalOption[]
  sealedAt: string | null
  /** His player id: the value for COUNCIL_MENU_PLAYER_ID when he sets up the council export. */
  playerId: string
}

const MAX_GOAL_TITLE = 200

/** Local start-of-day, matching src/actions/tap-the-vein.ts. */
function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toView(playerId: string, loaded: NonNullable<Awaited<ReturnType<typeof loadMenuForSession>>>): MorningMenuView {
  return { sessionDate: loaded.sessionDate, items: loaded.items, goals: loaded.goals, sealedAt: loaded.stored.sealedAt, playerId }
}

async function saveStored(sessionId: string, stored: StoredMorningMenu) {
  await db.tapTheVeinDailySession.update({
    where: { id: sessionId },
    data: { morningMenu: stored as unknown as Prisma.InputJsonValue },
  })
}

/** Today's menu. */
export async function getMorningMenu(): Promise<Result<MorningMenuView>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const loaded = await loadMenuForSession(player.id, startOfDay())
    if (!loaded) return { error: 'No session today. Open Tap the Vein first.' }
    return toView(player.id, loaded)
  } catch (e) {
    console.error('[ttv-menu:get]', e)
    return { error: 'Failed to load the menu' }
  }
}

/**
 * Attach a committed task to a goal. Updates the task's lineage snapshot and the
 * quest it was born as, so the quest, the task and the menu tell the same story.
 */
async function bridgeTask(playerId: string, taskId: string, goalId: string): Promise<string | null> {
  const task = await db.tapTheVeinTask.findFirst({
    where: { id: taskId, playerId },
    select: { id: true, questId: true },
  })
  if (!task) return 'That task is no longer here.'
  const goal = await db.lensGoal.findFirst({
    where: { id: goalId, playerId, status: 'active' },
    select: { id: true, domain: true, cadence: true },
  })
  if (!goal) return 'That lens goal is no longer active.'
  const snapshot = await buildLensGoalSnapshot(goal.id, playerId, 'attach_snapshot')
  if (!snapshot) return 'That lens goal thread could not be traced.'
  await db.$transaction(async (tx) => {
    await tx.tapTheVeinTask.update({
      where: { id: task.id },
      data: {
        lensGoalId: goal.id,
        lensLevel: goal.cadence,
        lensCategory: goal.domain,
        attachSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    })
    if (task.questId) {
      await tx.customBar.updateMany({
        where: { id: task.questId, creatorId: playerId },
        data: { lensGoalId: goal.id, plantSnapshot: snapshot as unknown as Prisma.InputJsonValue },
      })
    }
  })
  return null
}

/** Record a bridge (or "left unaligned", goalId null) for one menu item. */
async function applyBridge(playerId: string, key: string, goalId: string | null): Promise<Result<MorningMenuView>> {
  const loaded = await loadMenuForSession(playerId, startOfDay())
  if (!loaded) return { error: 'No session today. Open Tap the Vein first.' }
  const item = loaded.items.find((i) => i.key === key)
  if (!item) return { error: 'That line is no longer on the menu.' }

  const stored: StoredMorningMenu = { ...loaded.stored, lines: { ...loaded.stored.lines } }

  if (item.source === 'task' && item.taskId && goalId) {
    const err = await bridgeTask(playerId, item.taskId, goalId)
    if (err) return { error: err }
    delete stored.lines[key]
  } else {
    if (goalId && !loaded.goals.some((g) => g.id === goalId)) {
      return { error: 'That lens goal is no longer active.' }
    }
    stored.lines[key] = { lensGoalId: goalId }
  }
  await saveStored(loaded.sessionId, stored)

  const reloaded = await loadMenuForSession(playerId, startOfDay())
  revalidatePath('/tap-the-vein')
  return reloaded ? toView(playerId, reloaded) : { error: 'Failed to reload the menu' }
}

/** He picks a goal for an item himself, or leaves it unaligned (goalId null). */
export async function setMenuBridge(input: { key: string; lensGoalId: string | null }): Promise<Result<MorningMenuView>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    return await applyBridge(player.id, input.key, input.lensGoalId || null)
  } catch (e) {
    console.error('[ttv-menu:setBridge]', e)
    return { error: 'Failed to save the bridge' }
  }
}

/**
 * He accepts the game master's suggestion. The suggestion is recomputed here
 * from live goals, never taken from the client. For a side quest, `title` is his
 * edit of the proposed goal; the new goal is created one time scale down and the
 * item is bridged to it.
 */
export async function acceptMenuSuggestion(input: { key: string; title?: string }): Promise<Result<MorningMenuView>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const loaded = await loadMenuForSession(player.id, startOfDay())
    if (!loaded) return { error: 'No session today. Open Tap the Vein first.' }
    const item = loaded.items.find((i) => i.key === input.key)
    if (!item) return { error: 'That line is no longer on the menu.' }
    if (item.bridge) return toView(player.id, loaded)

    const suggestion = suggestBridge(item.text, loaded.goals)
    if (!suggestion) return { error: 'No suggestion for this line. Pick a goal instead.' }

    if (suggestion.kind === 'align') {
      return await applyBridge(player.id, item.key, suggestion.goal.id)
    }

    const title = (input.title ?? suggestion.title).trim().slice(0, MAX_GOAL_TITLE)
    if (!title) return { error: 'Name the new goal first.' }
    const parent = await db.lensGoal.findFirst({
      where: { id: suggestion.parent.id, playerId: player.id, status: 'active' },
      select: { id: true, domain: true, satisfactionPayoff: true, superpowerSource: true },
    })
    if (!parent) return { error: 'That lens goal is no longer active.' }
    const lens = await ensureCadenceLens(player.id, suggestion.cadence)
    const siblings = await db.lensGoal.count({
      where: { playerId: player.id, parentGoalId: parent.id, cadence: suggestion.cadence, status: 'active' },
    })
    const created = await db.lensGoal.create({
      data: {
        playerId: player.id,
        lensId: lens.id,
        domain: parent.domain,
        cadence: suggestion.cadence,
        title,
        parentGoalId: parent.id,
        satisfactionPayoff: parent.satisfactionPayoff,
        superpowerSource: parent.superpowerSource,
        alignmentType: 'progress',
        status: 'active',
        keepOrder: siblings + 1,
      },
      select: { id: true },
    })
    revalidatePath('/observatory')
    return await applyBridge(player.id, item.key, created.id)
  } catch (e) {
    console.error('[ttv-menu:accept]', e)
    return { error: 'Failed to accept the suggestion' }
  }
}

/**
 * Seal the menu: freeze what the council reads. Only bridged items carry a goal;
 * a suggestion he never accepted goes out as unaligned. Sealing again replaces
 * the frozen copy.
 */
export async function sealMorningMenu(): Promise<Result<MorningMenuView>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const loaded = await loadMenuForSession(player.id, startOfDay())
    if (!loaded) return { error: 'No session today. Open Tap the Vein first.' }
    if (loaded.items.length === 0) return { error: 'Keep at least one line before sealing the menu.' }
    const sealedAt = new Date().toISOString()
    const exported = toMenuExport(loaded.items, loaded.sessionDate, sealedAt)
    const stored: StoredMorningMenu = { ...loaded.stored, sealedAt, sealed: exported.items }
    await saveStored(loaded.sessionId, stored)
    revalidatePath('/tap-the-vein')
    return { ...toView(player.id, loaded), sealedAt }
  } catch (e) {
    console.error('[ttv-menu:seal]', e)
    return { error: 'Failed to seal the menu' }
  }
}
