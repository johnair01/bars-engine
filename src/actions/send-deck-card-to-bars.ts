'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { cookies } from 'next/headers'
import {
  findDeckCard,
  materializeDeckBar,
  claimPendingDeckBarForPlayer,
} from '@/lib/deck-bar'
import { signPendingIntent } from '@/lib/deck-pending-intent'
import {
  PENDING_DECK_COOKIE,
  PENDING_DECK_TTL_MS,
} from '@/lib/deck-pending-intent'
import type { SeedSubject } from '@/lib/allyship-deck/seed'

export type SendDeckCardResult =
  | { success: true; barId: string; placedInHand: boolean }
  | { needsAuth: true; pendingToken: string }
  | { error: string }

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
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slices 1–2)
 */
export async function sendDeckCardToBars(input: {
  cardId: string
  subject?: 'self' | 'campaign'
}): Promise<SendDeckCardResult> {
  const subject: SeedSubject = input.subject === 'campaign' ? 'campaign' : 'self'

  // Card must exist regardless of auth — fail fast on a bad id.
  if (!findDeckCard(input.cardId)) return { error: 'Card not found' }

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

/**
 * Claim a pending deck-card BAR after the player has authenticated. Thin action
 * wrapper over the shared claim helper; the auth actions call the helper
 * directly (they already know the player id).
 */
export async function claimPendingDeckBar(): Promise<SendDeckCardResult | { skipped: true }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  return claimPendingDeckBarForPlayer(player.id)
}
