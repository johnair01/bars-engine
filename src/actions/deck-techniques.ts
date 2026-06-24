'use server'

/**
 * Go Deeper — resolve a deck card's superpower move for the current player.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 4)
 *
 * Wires the pure decision core (`buildGoDeeper`) to the player: auth → loadout →
 * owned packs. Anonymous or loadout-less players get prompt states; never leaks
 * locked content (citation is coordinate-only).
 */

import type { Subject, MoveCard } from '@/lib/allyship-deck/types'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import { getCurrentPlayer } from '@/lib/auth'
import { getPlayerLoadout, getOwnedSuperpowers } from '@/lib/player-entitlements/loadout'
import { superpowerPackSku } from '@/lib/player-entitlements/superpower-skus'
import { offerHref } from '@/lib/launch/offers'
import { buildGoDeeper, type GoDeeperResult } from '@/lib/technique-library/superpowers'

export type CardGoDeeper =
  | { state: 'not_found' }
  | { state: 'needs_login' }
  | { state: 'needs_quiz' }
  | (GoDeeperResult & { upsellSku: string | null; upsellHref: string | null })

/** Resolve the Go Deeper affordance for one card, in the given subject reading. */
export async function getCardGoDeeper(cardId: string, subject: Subject): Promise<CardGoDeeper> {
  const card = assembleDeck().cards.find(
    (c): c is MoveCard => c.kind === 'move' && c.id === cardId,
  )
  if (!card) return { state: 'not_found' }

  const player = await getCurrentPlayer()
  if (!player) return { state: 'needs_login' }

  const loadout = await getPlayerLoadout(player.id)
  if (!loadout) return { state: 'needs_quiz' }

  const owned = await getOwnedSuperpowers(player.id)
  const result = buildGoDeeper(card, loadout, subject, owned)

  const upsellSku = result.upsellSuperpower ? superpowerPackSku(result.upsellSuperpower) : null
  return {
    ...result,
    upsellSku,
    upsellHref: upsellSku ? offerHref(upsellSku) : null,
  }
}
