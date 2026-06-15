'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { verifyLicense } from '@/lib/gumroad'
import { DEFAULT_BOOK_KEY } from '@/lib/book-access'
import { grantEntitlement } from '@/lib/entitlements/service'

/** The launch entitlement SKU a verified book license grants. */
const BOOK_SKU = 'book-digital'

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
 * Redeem a Gumroad license key into the unified launch `Entitlement` for the
 * current player.
 *
 * Mirrors the Invite redemption pattern (acceptGoldenPathInvitation): verify an
 * external token, then write the access record. Requires a logged-in player so
 * the entitlement attaches to identity; logged-out callers get { needsLogin }.
 *
 * One entitlement model: the verified purchase grants `book-digital`, which
 * confers perpetual book ownership (the /handbook reader + the downloadable
 * copy) plus its bundled 30-day app-access trial — the same record the Gumroad
 * webhook + /redeem path produces, so a license key now resolves identically
 * wherever it's entered (launch-paywall-integration spec).
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

  // Already redeemed this book — idempotent success, and skip re-verifying so a
  // re-submit doesn't burn a use against Gumroad's shared license cap.
  const existing = await db.entitlement.findFirst({
    where: { playerId: player.id, sku: BOOK_SKU, status: 'active' },
    select: { id: true },
  })
  if (existing) return { success: true, bookKey }

  const verified = await verifyLicense(licenseKey, { increment: true })
  if (!verified.ok) {
    return { error: ERRORS[verified.reason] ?? ERRORS.invalid }
  }

  // Idempotent on the Gumroad sale id, so a replay (or the webhook racing this
  // path) can't double-grant.
  await grantEntitlement({
    playerId: player.id,
    sku: BOOK_SKU,
    source: 'gumroad',
    externalOrderId: verified.saleId,
  })

  revalidatePath('/handbook')
  revalidatePath('/handbook/unlock')
  revalidatePath('/downloads')
  return { success: true, bookKey }
}
