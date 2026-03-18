'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
