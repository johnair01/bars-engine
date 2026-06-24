'use server'

/**
 * Superpower loadout actions.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 1)
 */

import { revalidatePath } from 'next/cache'
import { requirePlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getActiveEntitlements, grantEntitlement, hasCapability } from '@/lib/entitlements/service'
import type { Superpower } from '@/lib/technique-library'
import { isSuperpower, superpowerPackSku } from '@/lib/player-entitlements/superpower-skus'

export interface SaveLoadoutResult {
  success: boolean
  error?: string
  /** The inner superpower whose pack was just granted (deck owners only), if any. */
  data?: { granted?: Superpower }
}

/**
 * Persist the player's two-superpower loadout. Login required.
 *
 * Deferred inner-pack grant: if the player owns the base deck (`deck-digital`),
 * grant their INNER superpower's pack so the first Go Deeper on a self card pays
 * off. Guarded against double-grant (grant is only id-idempotent with an order).
 */
export async function saveSuperpowerLoadout(
  inner: Superpower,
  outer: Superpower,
): Promise<SaveLoadoutResult> {
  let playerId: string
  try {
    playerId = await requirePlayer()
  } catch {
    return { success: false, error: 'Log in to save your superpowers.' }
  }

  if (!isSuperpower(inner) || !isSuperpower(outer)) {
    return { success: false, error: 'Invalid superpower selection.' }
  }

  await db.player.update({
    where: { id: playerId },
    data: { superpowerInner: inner, superpowerOuter: outer, quizCompletedAt: new Date() },
  })

  let granted: Superpower | undefined
  if (await hasCapability(playerId, 'deck-digital')) {
    const sku = superpowerPackSku(inner)
    const active = await getActiveEntitlements(playerId)
    if (!active.some((e) => e.sku === sku)) {
      await grantEntitlement({ playerId, sku, source: 'bundled-grant' })
      granted = inner
    }
  }

  revalidatePath('/deck')
  return { success: true, data: { granted } }
}
