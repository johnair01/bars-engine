'use server'

/**
 * Lens server actions (LENS1 / first slice). The Observatory UI is later; for now
 * we expose just enough to attach BARs to today's lens.
 */

import { getCurrentPlayer } from '@/lib/auth'
import { ensureTodayLens, type DailyLens } from '@/lib/lenses/ensure'

export type LensResult<T> = T | { error: string }

/** Get-or-create today's daily Lens for the current player. */
export async function getOrCreateTodayLens(): Promise<LensResult<{ lens: DailyLens }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  const lens = await ensureTodayLens(player.id)
  if (!lens) return { error: 'Failed to load today’s lens' }
  return { lens }
}
