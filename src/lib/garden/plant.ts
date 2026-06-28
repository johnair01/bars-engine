/**
 * Shared "plant a BAR in the Garden" writer — the single seam used by both the
 * in-ritual Tap the Vein plant gesture (`plantTask`) and the standalone
 * Hand/Vault → Garden plant (`plantBarToGarden`). Plain module (no `'use server'`)
 * so both server-action files can import it.
 *
 * Planting: set `gardenId` (membership = planted) + the EA triad (load-bearing
 * for lens/campaign alignment + emotional-alchemy moves), mature the seed out of
 * the holding pen to `context_named` (so it homes in the Garden and leaves the
 * Hand/Vault movable set — `isHandVaultMovable` excludes `context_named`), and
 * free any Hand slot it occupied (a planted seed lives in the Garden, not the Hand).
 */

import { db } from '@/lib/db'
import { personalGardenId } from '@/lib/lenses/ensure'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'

/** Separator for multiselect EA-triad values stored as a single string (matches garden.ts firstOf). */
export const EA_SEP = ' | '

export async function writePlantTriadToBar(
  playerId: string,
  barId: string,
  triad: { experienceIntent: string; dissatisfaction: string[]; satisfaction: string[] },
): Promise<void> {
  const existing = await db.customBar.findUnique({
    where: { id: barId },
    select: { seedMetabolization: true },
  })
  await db.customBar.update({
    where: { id: barId },
    data: {
      gardenId: personalGardenId(playerId),
      experienceIntent: triad.experienceIntent,
      dissatisfaction: triad.dissatisfaction.join(EA_SEP),
      satisfaction: triad.satisfaction.join(EA_SEP),
      seedMetabolization: mergeSeedMetabolization(existing?.seedMetabolization ?? null, {
        maturity: 'context_named',
      }),
    },
  })
  await db.handSlot.updateMany({
    where: { playerId, barId },
    data: { barId: null, isCarrying: false },
  })
}
