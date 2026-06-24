/**
 * Deck card → ready-to-practice BAR (plain module, no 'use server').
 *
 * Holds the shared materialize + pending-claim logic so both the deck action
 * (`send-deck-card-to-bars.ts`) and the auth action (`mga-auth.ts`) can call it
 * without a 'use server' → 'use server' cross-import (forbidden under Turbopack —
 * see hand-service.ts for the same pattern).
 *
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slices 1–2)
 */

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import { buildDeckSeed, type SeedSubject } from '@/lib/allyship-deck/seed'
import { addBarToHandForPlayer } from '@/lib/hand-service'
import {
  PENDING_DECK_COOKIE,
  verifyPendingIntent,
} from '@/lib/deck-pending-intent'
import type { AllyshipDeck, MoveCard } from '@/lib/allyship-deck/types'

export type MaterializeResult =
  | { success: true; barId: string; placedInHand: boolean }
  | { error: string }

/** Authoritative deck, assembled deterministically (no AI/DB) and memoized per process. */
let cachedDeck: AllyshipDeck | null = null
function deck(): AllyshipDeck {
  return (cachedDeck ??= assembleDeck())
}

/** Resolve a card id to its authoritative move card (server-side, never client-trusted). */
export function findDeckCard(cardId: string): MoveCard | undefined {
  return deck().cards.find((c): c is MoveCard => c.kind === 'move' && c.id === cardId)
}

/**
 * Materialize a deck card into a *ready-to-practice* BAR owned by `playerId`.
 *
 * Deck cards skip the seed → plant → claim → grow ceremony: the BAR is created
 * self-claimed (`claimedById = playerId`) and `active`, then we attempt to place
 * it in an open Hand slot. Provenance is stamped from the authoritative card.
 */
export async function materializeDeckBar(
  playerId: string,
  cardId: string,
  subject: SeedSubject,
): Promise<MaterializeResult> {
  const card = findDeckCard(cardId)
  if (!card) return { error: 'Card not found' }

  const seed = buildDeckSeed(card, subject)

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: playerId,
        title: seed.title,
        description: seed.description,
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: playerId, // self-claimed — ready to practice, no plant step
        inputs: JSON.stringify([]),
        rootId: seed.rootId,
        agentMetadata: JSON.stringify(seed.provenance),
      },
    })

    // Try to drop it straight into the Hand; if full, it stays in the Vault.
    const placed = await addBarToHandForPlayer(playerId, bar.id)
    const placedInHand = 'success' in placed && placed.success === true

    revalidatePath('/')
    revalidatePath('/vault')
    revalidatePath('/bars')
    revalidatePath('/hand')

    return { success: true, barId: bar.id, placedInHand }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to send to BARS' }
  }
}

/**
 * Claim a pending deck-card intent for a now-authenticated player.
 *
 * Reads the signed `bars_deck_pending` cookie (set by the logged-out "Send to
 * BARS" branch), materializes the BAR into the player's account, and clears the
 * cookie (single-use). A no-op when no valid pending intent exists — so it is
 * safe to call unconditionally after every signup/login.
 */
export async function claimPendingDeckBarForPlayer(
  playerId: string,
): Promise<MaterializeResult | { skipped: true }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(PENDING_DECK_COOKIE)?.value
  const intent = verifyPendingIntent(token)
  if (!intent) {
    // Clear any stale/garbage cookie so it can't linger.
    if (token) cookieStore.delete(PENDING_DECK_COOKIE)
    return { skipped: true }
  }

  const result = await materializeDeckBar(playerId, intent.cardId, intent.subject)
  cookieStore.delete(PENDING_DECK_COOKIE) // single-use, regardless of outcome
  return result
}
