'use server'

/**
 * Garden (LENS first slice) — the player's planted BARs. A BAR is "in the Garden"
 * when it has a `gardenId` (membership = planted). Separate from Hand/Vault/World.
 * Growth visuals here are minimal for the slice (existing maturity + composted);
 * provenance-derived `gardenSignal` is a later phase.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { personalGardenId } from '@/lib/lenses/ensure'
import { parseSeedMetabolization, effectiveMaturity } from '@/lib/bar-seed-metabolization/parse'

export type GardenPlant = {
  id: string
  title: string
  element: string | null
  maturity: string | null
  composted: boolean
  lensId: string | null
}

export async function getGarden(): Promise<{ plants: GardenPlant[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const bars = await db.customBar.findMany({
      where: { creatorId: player.id, gardenId: personalGardenId(player.id) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, nation: true, seedMetabolization: true, archivedAt: true, lensId: true },
    })
    const plants: GardenPlant[] = bars.map((b) => ({
      id: b.id,
      title: b.title,
      element: b.nation,
      maturity: effectiveMaturity(parseSeedMetabolization(b.seedMetabolization)) ?? null,
      composted: !!b.archivedAt,
      lensId: b.lensId,
    }))
    return { plants }
  } catch (e) {
    console.error('[garden:getGarden]', e)
    return { error: 'Failed to load garden' }
  }
}
