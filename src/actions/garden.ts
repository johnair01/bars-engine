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
  experienceIntent: string | null
  /** EA arc, summarized "from → to" from the captured triad (or null). */
  eaArc: string | null
}

function firstOf(s: string | null): string | null {
  if (!s) return null
  return s.split(' | ')[0]?.trim() || null
}

export async function getGarden(): Promise<{ plants: GardenPlant[] } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }
  try {
    const bars = await db.customBar.findMany({
      where: { creatorId: player.id, gardenId: personalGardenId(player.id) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, nation: true, seedMetabolization: true, archivedAt: true,
        lensId: true, experienceIntent: true, dissatisfaction: true, satisfaction: true,
      },
    })
    const plants: GardenPlant[] = bars.map((b) => {
      const from = firstOf(b.dissatisfaction)
      const to = firstOf(b.satisfaction)
      return {
        id: b.id,
        title: b.title,
        element: b.nation,
        maturity: effectiveMaturity(parseSeedMetabolization(b.seedMetabolization)) ?? null,
        composted: !!b.archivedAt,
        lensId: b.lensId,
        experienceIntent: b.experienceIntent,
        eaArc: from && to ? `${from} → ${to}` : null,
      }
    })
    return { plants }
  } catch (e) {
    console.error('[garden:getGarden]', e)
    return { error: 'Failed to load garden' }
  }
}
