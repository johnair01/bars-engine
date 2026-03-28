'use server'

/**
 * Unlock hook: when a player completes a campaign quest.
 * @see .specify/specs/game-loop-tighten-admin-player/spec.md
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type OnPlayerQuestCompletionResult =
  | { success: true }
  | { error: string }

/**
 * Called when a player completes a campaign quest.
 * Emits event/log for admin visibility; Phase 2 can extend to instance funding, Kotter advance, new slot.
 */
export async function onPlayerQuestCompletion(
  questId: string,
  playerId: string,
  campaignRef: string
): Promise<OnPlayerQuestCompletionResult> {
  try {
    // Event/log: record for analytics and admin visibility
    console.log(
      `[onPlayerQuestCompletion] questId=${questId} playerId=${playerId} campaignRef=${campaignRef}`
    )

    // Optional: persist to a completion log table if we add one
    // For now, log only. Phase 2 can add:
    // - Instance funding (increment vibeulon pool)
    // - Kotter stage advance (when N completions reached)
    // - New slot availability (draw from deck when slot freed)

    const instance = await db.instance.findFirst({
      where: { campaignRef },
      select: { id: true, kotterStage: true },
    })

    if (instance) {
      // Log for admin: campaign quest completed in active instance
      console.log(
        `[onPlayerQuestCompletion] instanceId=${instance.id} kotterStage=${instance.kotterStage}`
      )
    }

    revalidatePath('/campaign/board')
    revalidatePath('/campaign/hub')
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    console.error('[onPlayerQuestCompletion]', e)
    return {
      error: e instanceof Error ? e.message : 'Unlock hook failed',
    }
  }
}
