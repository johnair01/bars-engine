/**
 * Adventure Completion — Query convention (Option B)
 *
 * Treats "ThreadProgress.completedAt where thread.adventureId = X" as adventure completed.
 * No schema change. For badges, history, or "adventures I've completed" UI.
 *
 * See .specify/specs/adventure-completion-record/spec.md
 */

import { db } from '@/lib/db'

/**
 * Returns true if the player has completed the adventure.
 * A player completes an adventure when they complete the thread linked to that adventure
 * (ThreadProgress.completedAt is set for a thread with adventureId = adventureId).
 */
export async function hasCompletedAdventure(
  playerId: string,
  adventureId: string
): Promise<boolean> {
  const progress = await db.threadProgress.findFirst({
    where: {
      playerId,
      completedAt: { not: null },
      thread: {
        adventureId,
      },
    },
    select: { id: true },
  })
  return !!progress
}

/**
 * Returns adventure IDs the player has completed.
 * Useful for "adventures I've completed" badges, history, or UI.
 */
export async function getCompletedAdventureIds(
  playerId: string
): Promise<string[]> {
  const progresses = await db.threadProgress.findMany({
    where: {
      playerId,
      completedAt: { not: null },
      thread: {
        adventureId: { not: null },
      },
    },
    select: {
      thread: {
        select: { adventureId: true },
      },
    },
  })
  return progresses
    .map((p) => p.thread.adventureId)
    .filter((id): id is string => !!id)
}
