'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import { buildDeckSeed, type SeedSubject } from '@/lib/allyship-deck/seed'
import { addBarToHandForPlayer } from '@/lib/hand-service'
import {
  PENDING_DECK_COOKIE,
  PENDING_DECK_TTL_MS,
  signPendingIntent,
} from '@/lib/deck-pending-intent'
import type { AllyshipDeck, MoveCard } from '@/lib/allyship-deck/types'

export type SendDeckCardResult =
  | { success: true; barId: string; placedInHand: boolean }
  | { needsAuth: true; pendingToken: string }
  | { error: string }

/** Authoritative deck, assembled deterministically (no AI/DB) and memoized per process. */
let cachedDeck: AllyshipDeck | null = null
function deck(): AllyshipDeck {
  return (cachedDeck ??= assembleDeck())
}

/** Resolve a card id to its authoritative move card (server-side, never client-trusted). */
function findCard(cardId: string): MoveCard | undefined {
  return deck().cards.find((c): c is MoveCard => c.kind === 'move' && c.id === cardId)
}

/**
 * Materialize a deck card into a *ready-to-practice* BAR owned by `playerId`.
 *
 * Deck cards skip the seed → plant → claim → grow ceremony: the BAR is created
 * self-claimed (`claimedById = playerId`) and `active`, then we attempt to place
 * it in an open Hand slot. Provenance is stamped from the authoritative card.
 *
 * Shared by the authenticated "Send to BARS" branch and the post-signup claim
 * path (`claimPendingDeckBar`) so both land identically.
 *
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slice 1)
 */
export async function materializeDeckBar(
  playerId: string,
  cardId: string,
  subject: SeedSubject,
): Promise<{ success: true; barId: string; placedInHand: boolean } | { error: string }> {
  const card = findCard(cardId)
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
 * "Send to BARS" — capture a deck card as a ready-to-practice BAR.
 *
 * - **Logged in**: create the BAR, place it in the Hand, return its id so the
 *   client can land the player on NOW home with the card in hand.
 * - **Logged out**: never a dead end. Sign the *intent* (card + reading) into a
 *   short-lived httpOnly cookie and return `{ needsAuth }` so the client can route
 *   to signup; the BAR is materialized after the account is created.
 *
 * Card text is read from the authoritative `assembleDeck()` (not the client), so
 * the captured BAR is trustworthy.
 *
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slice 1)
 */
export async function sendDeckCardToBars(input: {
  cardId: string
  subject?: 'self' | 'campaign'
}): Promise<SendDeckCardResult> {
  const subject: SeedSubject = input.subject === 'campaign' ? 'campaign' : 'self'

  // Card must exist regardless of auth — fail fast on a bad id.
  if (!findCard(input.cardId)) return { error: 'Card not found' }

  const player = await getCurrentPlayer()

  if (!player) {
    // Capture the intent; let the client take the visitor to signup.
    const pendingToken = signPendingIntent({ cardId: input.cardId, subject })
    const cookieStore = await cookies()
    cookieStore.set(PENDING_DECK_COOKIE, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(PENDING_DECK_TTL_MS / 1000),
    })
    return { needsAuth: true, pendingToken }
  }

  return materializeDeckBar(player.id, input.cardId, subject)
}
