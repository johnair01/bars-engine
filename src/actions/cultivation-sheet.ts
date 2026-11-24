'use server'

import { currentPlayer } from '@/lib/between/store'
import { recordCompletedMoveFor } from '@/lib/passport/store'

/** Attempt ids come from the browser (crypto.randomUUID when the attempt is chosen); anything else is refused. */
const ATTEMPT_ID = /^[A-Za-z0-9-]{8,64}$/

/**
 * Records a completed Emotional Alchemy move on the signed-in player's sheet (cultivated character T006, FR-003). The same
 * attempt id counts once. It returns no number: the page draws no qi count (FR-010).
 */
export async function recordCompletedMove(attemptId: string): Promise<{ ok: true; counted: boolean } | { ok: false; reason: string }> {
  if (typeof attemptId !== 'string' || !ATTEMPT_ID.test(attemptId)) return { ok: false, reason: 'bad attempt id' }
  const player = await currentPlayer()
  if (!player) return { ok: false, reason: 'signed out' }
  try {
    return { ok: true, ...(await recordCompletedMoveFor(player, attemptId)) }
  } catch {
    return { ok: false, reason: 'not recorded' }
  }
}
