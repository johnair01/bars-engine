'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type PlayerNextMove =
  | {
      kind: 'next_action'
      questId: string
      questTitle: string
      nextAction: string
      barId: string | null
    }
  | { kind: 'quest_needs_action'; questId: string; questTitle: string }
  | { kind: 'ttv_task'; taskId: string; taskText: string }
  | { kind: 'ttv_start' }
  | { kind: 'capture' }

/**
 * Link a BAR to a quest as "next smallest honest action."
 * One bridge per quest (replaces if exists).
 */
export async function linkBarToQuestAsNextAction(
  barId: string | null,
  questId: string,
  nextAction: string
): Promise<{ success: true } | { error: string }> {
  try {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const trimmed = nextAction?.trim()
    if (!trimmed) return { error: 'Next action text is required' }

    // Validate quest exists and player has access (assigned or can see)
    const quest = await db.customBar.findUnique({
      where: { id: questId },
      select: { id: true, type: true },
    })
    if (!quest) return { error: 'Quest not found' }

    const assignment = await db.playerQuest.findFirst({
      where: { playerId: player.id, questId },
    })
    if (!assignment) return { error: 'Quest not assigned to you' }

    // If barId provided, validate bar exists and player has access
    if (barId) {
      const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { id: true, creatorId: true },
      })
      if (!bar) return { error: 'BAR not found' }
      if (bar.creatorId !== player.id) return { error: 'You can only link your own BARs' }
    }

    await db.nextActionBridge.upsert({
      where: { questId },
      create: {
        questId,
        barId: barId || undefined,
        nextAction: trimmed,
      },
      update: {
        barId: barId ?? null,
        nextAction: trimmed,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to link next action'
    return { error: message }
  }
}

/**
 * Get the next action for a quest, if any.
 */
export async function getNextActionForQuest(
  questId: string
): Promise<{ barId: string | null; nextAction: string } | null> {
  try {
    const bridge = await db.nextActionBridge.findUnique({
      where: { questId },
      select: { barId: true, nextAction: true },
    })
    if (!bridge) return null
    return {
      barId: bridge.barId,
      nextAction: bridge.nextAction,
    }
  } catch {
    return null
  }
}

/**
 * Star of Bethlehem — one computed "what do I do next?" signal for NOW.
 * Priority: quest w/ next action → quest needing action → TTV task → TTV start → capture.
 */
export async function getPlayerNextMove(
  playerId: string
): Promise<PlayerNextMove | null> {
  const assignments = await db.playerQuest.findMany({
    where: { playerId, status: 'assigned' },
    include: {
      quest: {
        select: {
          id: true,
          title: true,
          nextActionBridgesAsQuest: { select: { nextAction: true, barId: true } },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  })

  for (const a of assignments) {
    const bridge = a.quest.nextActionBridgesAsQuest
    if (bridge?.nextAction?.trim()) {
      return {
        kind: 'next_action',
        questId: a.quest.id,
        questTitle: a.quest.title,
        nextAction: bridge.nextAction.trim(),
        barId: bridge.barId,
      }
    }
  }

  const needsAction = assignments[0]
  if (needsAction) {
    return {
      kind: 'quest_needs_action',
      questId: needsAction.quest.id,
      questTitle: needsAction.quest.title,
    }
  }

  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const openTask = await db.tapTheVeinTask.findFirst({
    where: {
      playerId,
      status: { in: ['committed', 'in_progress'] },
      dailySession: { sessionDate: { gte: startOfDay } },
    },
    orderBy: [{ priorityRank: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, originalText: true },
  })

  if (openTask) {
    return {
      kind: 'ttv_task',
      taskId: openTask.id,
      taskText: openTask.originalText,
    }
  }

  const todaySession = await db.tapTheVeinDailySession.findFirst({
    where: { playerId, sessionDate: { gte: startOfDay } },
    select: { status: true },
  })

  if (!todaySession || todaySession.status !== 'sealed') {
    return { kind: 'ttv_start' }
  }

  return { kind: 'capture' }
}

/**
 * Tandem-style cascade hint: after completing a quest, surface the next assigned
 * quest on the same campaign (if any) that lacks a next-action bridge.
 */
export async function getCascadeQuestAfterComplete(
  playerId: string,
  completedQuestId: string
): Promise<{ questId: string; questTitle: string } | null> {
  const completed = await db.customBar.findUnique({
    where: { id: completedQuestId },
    select: { campaignRef: true },
  })
  if (!completed?.campaignRef) return null

  const nextAssignment = await db.playerQuest.findFirst({
    where: {
      playerId,
      status: 'assigned',
      questId: { not: completedQuestId },
      quest: {
        campaignRef: completed.campaignRef,
        nextActionBridgesAsQuest: { is: null },
      },
    },
    include: { quest: { select: { id: true, title: true } } },
    orderBy: { assignedAt: 'asc' },
  })

  if (!nextAssignment) return null

  return {
    questId: nextAssignment.quest.id,
    questTitle: nextAssignment.quest.title,
  }
}
