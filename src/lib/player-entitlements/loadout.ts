/**
 * Server-only loadout + pack-ownership reads.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 1)
 *
 * Thin DB wrappers over the pure helpers in `superpower-skus.ts`. Ownership is
 * derived from active entitlements whose sku matches the pack pattern, so this
 * needs no `offers.ts` pack OfferKeys to function.
 */

import { db } from '@/lib/db'
import { getActiveEntitlements } from '@/lib/entitlements/service'
import type { Loadout, Superpower } from '@/lib/technique-library'
import { loadoutFromPlayer, superpowersFromEntitlements } from './superpower-skus'

/** The player's saved two-superpower loadout, or null if not set/invalid. */
export async function getPlayerLoadout(playerId: string): Promise<Loadout | null> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { superpowerInner: true, superpowerOuter: true },
  })
  if (!player) return null
  return loadoutFromPlayer(player)
}

/** The superpowers whose expansion packs the player owns (from active entitlements). */
export async function getOwnedSuperpowers(playerId: string): Promise<Superpower[]> {
  const entitlements = await getActiveEntitlements(playerId)
  return superpowersFromEntitlements(entitlements)
}
