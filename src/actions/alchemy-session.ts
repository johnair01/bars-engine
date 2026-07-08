'use server'

/**
 * Emotional Alchemy — session logging (service Phase 1). The "extension of BARs
 * logging": a structured-only practice record that hangs off the charge BAR,
 * mirroring persist321Session. NB: no raw blocker/story text is ever stored
 * (§1.6) — only enums, numbers, the thread label, and the BAR reference.
 *
 * Spec: .specify/specs/emotional-alchemy-service/spec.md § API Contracts
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import type { AlchemySessionInput } from '@/lib/emotional-alchemy'

export async function logAlchemySession(
  input: AlchemySessionInput
): Promise<{ success: true; sessionId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const session = await db.alchemySession.create({
      data: {
        playerId: player.id,
        chargeSourceBarId: input.chargeSourceBarId ?? null,
        source: input.source,
        channel: input.vectorBefore.channel,
        intensityBefore: input.vectorBefore.intensity,
        altitude: input.vectorBefore.altitude,
        target: input.vectorBefore.target,
        drawnCardId: input.drawnCardId ?? null,
        toolId: input.toolId,
        rolePath: JSON.stringify(input.rolePath),
        showUpKind: input.showUp?.kind ?? null,
        showUpRecipient: input.showUp?.recipient ?? null,
        showUpDate: input.showUp?.date ? new Date(input.showUp.date) : null,
        showUpDoneCheck: input.showUp?.doneCheck ?? null,
        intensityAfter: input.vectorAfterIntensity ?? null,
        timeboxKept: input.timeboxKept ?? null,
        exitedGracefully: input.exitedGracefully ?? false,
        threadLabel: input.threadLabel ?? null,
        flags: JSON.stringify(input.flags),
      },
    })

    // Provenance back-link on the charge BAR (mirrors source321SessionId).
    if (input.chargeSourceBarId) {
      await db.customBar
        .update({ where: { id: input.chargeSourceBarId }, data: { sourceAlchemySessionId: session.id } })
        .catch((e) => console.warn('[alchemy-session] back-link skipped:', e))
    }

    return { success: true, sessionId: session.id }
  } catch (e) {
    console.error('[alchemy-session] logAlchemySession failed:', e)
    return { error: 'Could not log this session' }
  }
}

/** Read a charge BAR's practice history (for the vault). Owner-scoped. */
export async function getAlchemySessionsForBar(barId: string) {
  const player = await getCurrentPlayer()
  if (!player) return []
  return db.alchemySession.findMany({
    where: { playerId: player.id, chargeSourceBarId: barId },
    orderBy: { createdAt: 'desc' },
  })
}
