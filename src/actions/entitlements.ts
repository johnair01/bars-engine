'use server'

/**
 * Entitlement actions — thin server wrappers over the entitlement service.
 * Track A: redeem a purchase code into app access; admin-mint codes for
 * week-one manual fulfillment before the Gumroad webhook lands.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { grantEntitlement, mintRedemptionCode, redeemCode } from '@/lib/entitlements/service'
import { resolveLicense } from '@/lib/gumroad'
import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

function offerName(sku: string): string {
  return LAUNCH_OFFERS.find((o) => o.key === sku)?.name ?? sku
}

const REDEEM_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find that code or license key. Check for typos and try again.",
  expired: 'That code has expired.',
  void: 'That code is no longer valid.',
  claimed_by_other: 'That code has already been redeemed by another account.',
  refunded: 'That purchase was refunded or disputed, so it can no longer unlock access.',
  over_uses: 'That license key has already been used too many times.',
  config: 'The store is not configured yet. Please try again later.',
  network: 'Could not reach the store to verify your key. Please try again.',
}

/** Where a buyer should go right after unlocking each SKU — the "now what?" CTA. */
const NEXT_STEP: Record<string, { href: string; label: string }> = {
  'book-digital': { href: '/handbook', label: 'Read the book' },
  'book-physical': { href: '/handbook', label: 'Read the digital book' },
  'rpg-handbook-digital': { href: '/handbook', label: 'Open the handbook' },
  'rpg-handbook-physical': { href: '/handbook', label: 'Open the digital handbook' },
  'deck-digital': { href: '/deck', label: 'Open the Oracle deck' },
  'game-subscription': { href: '/play', label: 'Start playing' },
  'founding-ally': { href: '/dashboard', label: 'Enter the app' },
}

function unlocked(sku: string, alreadyRedeemed: boolean) {
  // One unlock can open the reader, the deck, and downloads — revalidate broadly.
  for (const p of ['/', '/redeem', '/handbook', '/downloads']) revalidatePath(p)
  return {
    ok: true as const,
    sku,
    offerName: offerName(sku),
    alreadyRedeemed,
    nextStep: NEXT_STEP[sku] ?? { href: '/dashboard', label: 'Enter the app' },
    message: alreadyRedeemed
      ? `You've already unlocked ${offerName(sku)}.`
      : `Unlocked: ${offerName(sku)}.`,
  }
}

/**
 * Redeem a launch code OR a raw Gumroad license key for the signed-in player —
 * the single buyer-facing unlock surface (launch-paywall-integration spec).
 *
 *   1. Minted RedemptionCode — admin codes and every webhook-issued code (a
 *      Gumroad license key is stored verbatim as the code).
 *   2. Fallback — a bare license key whose sale webhook never minted a code:
 *      verify it directly against each SKU's Gumroad product and grant on match.
 */
export async function redeemLaunchCode(rawCode: string) {
  const value = (rawCode ?? '').trim()
  if (!value) return { ok: false as const, message: 'Enter a code or license key to redeem.' }

  const player = await getCurrentPlayer()
  if (!player) {
    return {
      ok: false as const,
      needsAuth: true,
      message: 'Sign in or create an account to redeem.',
    }
  }

  const coded = await redeemCode(value, player.id)
  if (coded.ok) return unlocked(coded.sku, coded.alreadyRedeemed)
  if (coded.reason !== 'not_found') {
    return { ok: false as const, message: REDEEM_MESSAGES[coded.reason] ?? 'Could not redeem that code.' }
  }

  const lic = await resolveLicense(value)
  if (lic.matched && lic.result.ok) {
    await grantEntitlement({
      playerId: player.id,
      sku: lic.sku,
      source: 'gumroad',
      externalOrderId: lic.result.saleId,
    })
    return unlocked(lic.sku, false)
  }
  if (lic.matched && !lic.result.ok) {
    return { ok: false as const, message: REDEEM_MESSAGES[lic.result.reason] ?? REDEEM_MESSAGES.not_found }
  }

  return { ok: false as const, message: REDEEM_MESSAGES.not_found }
}

/** Admin-only: mint a redemption code for a SKU (manual fulfillment). */
export async function mintLaunchCode(params: { sku: OfferKey; externalOrderId?: string; claimWindowDays?: number }) {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Authentication required')

  const withRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  const isAdmin = !!withRoles?.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) throw new Error('Unauthorized: Admin access required.')

  const rc = await mintRedemptionCode({
    sku: params.sku,
    externalOrderId: params.externalOrderId ?? null,
    claimWindowDays: params.claimWindowDays,
  })
  return { ok: true as const, code: rc.code, sku: rc.sku }
}
