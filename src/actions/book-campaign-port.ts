'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'

async function requireAdminPlayerId(): Promise<string> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

/**
 * Stub — full campaign/instance port is gated on campaign-ontology-alignment tasks.
 */
export async function previewPortBookCampaign(_input: { targetBookId: string; sourceBookId: string }) {
  try {
    await requireAdminPlayerId()
    return {
      success: true as const,
      planned: false as const,
      message:
        'Campaign port wizard is not implemented yet. Use quest thread import (book-gameplay-import) and align instances manually per campaign ontology spec.',
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Preview failed' }
  }
}

export async function commitPortBookCampaign(_input: { targetBookId: string; sourceBookId: string }) {
  try {
    await requireAdminPlayerId()
    return { error: 'Campaign port commit is not implemented in this slice.' as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Commit failed' }
  }
}
