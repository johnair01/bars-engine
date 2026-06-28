'use server'

/**
 * Garden (LENS first slice) — the player's planted BARs. A BAR is "in the Garden"
 * when it has a `gardenId` (membership = planted). Separate from Hand/Vault/World.
 * Growth visuals here are minimal for the slice (existing maturity + composted);
 * provenance-derived `gardenSignal` is a later phase.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { personalGardenId } from '@/lib/lenses/ensure'
import { parseSeedMetabolization, effectiveMaturity } from '@/lib/bar-seed-metabolization/parse'
import { writePlantTriadToBar } from '@/lib/garden/plant'

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

/**
 * Plant a BAR that already exists (in the Hand or Vault) into the Garden — the
 * Hand/Vault → Garden path. Captures the EA triad, sets gardenId, matures the
 * seed to `context_named`, and frees any Hand slot (via the shared planter).
 */
export async function plantBarToGarden(input: {
  barId: string
  experienceIntent: string
  dissatisfaction: string[]
  satisfaction: string[]
}): Promise<{ barId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const experienceIntent = (input.experienceIntent || '').trim()
  if (!experienceIntent) return { error: 'Name the desired outcome' }
  if (!input.dissatisfaction?.length) return { error: 'Name where you are now' }
  if (!input.satisfaction?.length) return { error: 'Name where you want to be' }

  try {
    const bar = await db.customBar.findUnique({
      where: { id: input.barId },
      select: { id: true, creatorId: true, status: true },
    })
    if (!bar || bar.creatorId !== player.id) return { error: 'BAR not found' }
    if (bar.status !== 'active') return { error: 'That BAR is no longer active' }

    await writePlantTriadToBar(player.id, input.barId, {
      experienceIntent,
      dissatisfaction: input.dissatisfaction,
      satisfaction: input.satisfaction,
    })

    revalidatePath('/garden')
    revalidatePath('/vault')
    revalidatePath('/')
    return { barId: input.barId }
  } catch (e) {
    console.error('[garden:plantBarToGarden]', e)
    return { error: 'Failed to plant' }
  }
}
