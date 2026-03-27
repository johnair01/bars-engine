'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { takeQuest } from '@/actions/quest-stewardship'

async function requireAdminPlayerId(): Promise<{ ok: true; playerId: string } | { ok: false; error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: 'Not logged in' }
  const admin = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!admin) return { ok: false, error: 'Admin required' }
  return { ok: true, playerId: player.id }
}

/**
 * Set `QuestThread.adventureId` for a library thread (admin/steward script or dashboard).
 * @see `.specify/specs/book-cyoa-campaign/spec.md` § API contracts
 */
export async function linkLibraryThreadToAdventure(
  threadId: string,
  adventureId: string
): Promise<{ success: true } | { error: string }> {
  const gate = await requireAdminPlayerId()
  if (!gate.ok) return { error: gate.error }
  try {
    const thread = await db.questThread.findUnique({ where: { id: threadId } })
    if (!thread) return { error: 'Thread not found' }
    if (thread.adventureId && thread.adventureId !== adventureId) {
      return { error: 'Thread already linked to another adventure' }
    }
    const adv = await db.adventure.findUnique({ where: { id: adventureId } })
    if (!adv) return { error: 'Adventure not found' }
    await db.questThread.update({
      where: { id: threadId },
      data: { adventureId },
    })
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to link'
    return { error: msg }
  }
}

/**
 * Idempotent progress row for `/campaign` + CampaignReader (aligns with `saveAdventureProgress`).
 */
export async function ensurePlayerAdventureProgress(
  playerId: string,
  adventureId: string
): Promise<{ success: true } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player || player.id !== playerId) return { error: 'Unauthorized' }
  const adv = await db.adventure.findUnique({
    where: { id: adventureId, status: 'ACTIVE' },
    select: { startNodeId: true },
  })
  if (!adv?.startNodeId) return { error: 'Adventure not found or inactive' }
  const existing = await db.playerAdventureProgress.findUnique({
    where: { playerId_adventureId: { playerId, adventureId } },
  })
  if (!existing) {
    await db.playerAdventureProgress.create({
      data: {
        playerId,
        adventureId,
        currentNodeId: adv.startNodeId,
        stateData: '{}',
      },
    })
  }
  return { success: true }
}

/**
 * Assign/start a library quest from a book passage — uses existing stewardship path.
 */
export async function startQuestFromBookPassage(questId: string) {
  return takeQuest(questId)
}
