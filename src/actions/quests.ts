'use server'

/**
 * Quest ↔ lens-goal reads (QLA).
 *
 * A quest is **aligned** when it hangs on an active `week`-cadence lens goal that
 * rolls up month→quarter→year; otherwise it is a **shadow quest** (out of alignment),
 * surfaced for fold-in. Lineage is resolved through the existing snapshot machinery.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { resolveLensGoalTrace } from '@/lib/lenses/lineage'
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
