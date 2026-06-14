'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { verifyLicense } from '@/lib/gumroad'
import { DEFAULT_BOOK_KEY } from '@/lib/book-access'

export type RedeemResult =
  | { success: true; bookKey: string }
  | { needsLogin: true }
  | { error: string }

const ERRORS: Record<string, string> = {
  invalid: 'That license key was not recognized. Check it and try again.',
  refunded: 'This purchase was refunded or disputed, so it can no longer unlock the book.',
  over_uses: 'This license key has already been used too many times.',
  config: 'The store is not configured yet. Please try again later.',
  network: 'Could not reach the store to verify your key. Please try again.',
}

/**
 * Redeem a Gumroad license key into a BookEntitlement for the current player.
 *
 * Mirrors the Invite redemption pattern (acceptGoldenPathInvitation): verify an
 * external token, then write the access record. Requires a logged-in player so
 * the entitlement attaches to identity; logged-out callers get { needsLogin }.
 */
export async function redeemBookLicense(input: {
  licenseKey: string
  bookKey?: string
}): Promise<RedeemResult> {
  const bookKey = input.bookKey ?? DEFAULT_BOOK_KEY
  const licenseKey = (input.licenseKey ?? '').trim()
  if (!licenseKey) return { error: 'Enter your license key.' }

  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  // Already entitled — idempotent success (e.g. re-submitting the same key).
  const existing = await db.bookEntitlement.findUnique({
    where: { playerId_bookKey: { playerId: player.id, bookKey } },
    select: { status: true },
  })
  if (existing?.status === 'active') return { success: true, bookKey }

  const verified = await verifyLicense(licenseKey, { increment: true })
  if (!verified.ok) {
    return { error: ERRORS[verified.reason] ?? ERRORS.invalid }
  }

  await db.bookEntitlement.upsert({
    where: { playerId_bookKey: { playerId: player.id, bookKey } },
    create: {
      playerId: player.id,
      bookKey,
      source: 'gumroad',
      licenseKey,
      gumroadSaleId: verified.saleId,
      status: 'active',
      metadata: JSON.stringify({ email: verified.email, uses: verified.uses }),
    },
    update: {
      status: 'active',
      licenseKey,
      gumroadSaleId: verified.saleId,
      revokedAt: null,
      metadata: JSON.stringify({ email: verified.email, uses: verified.uses }),
    },
  })

  revalidatePath('/handbook')
  revalidatePath('/handbook/unlock')
  return { success: true, bookKey }
}
