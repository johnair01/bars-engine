'use server'

/**
 * Entitlement actions — thin server wrappers over the entitlement service.
 * Track A: redeem a purchase code into app access; admin-mint codes for
 * week-one manual fulfillment before the Gumroad webhook lands.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { mintRedemptionCode, redeemCode } from '@/lib/entitlements/service'
import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

function offerName(sku: string): string {
  return LAUNCH_OFFERS.find((o) => o.key === sku)?.name ?? sku
}

const REDEEM_MESSAGES: Record<string, string> = {
  not_found: "We couldn't find that code. Check for typos and try again.",
  expired: 'That code has expired.',
  void: 'That code is no longer valid.',
  claimed_by_other: 'That code has already been redeemed by another account.',
}

/** Redeem a launch code for the signed-in player. */
export async function redeemLaunchCode(rawCode: string) {
  const code = (rawCode ?? '').trim()
  if (!code) return { ok: false as const, message: 'Enter a code to redeem.' }

  const player = await getCurrentPlayer()
  if (!player) {
    return {
      ok: false as const,
      needsAuth: true,
      message: 'Sign in or create an account to redeem your code.',
    }
  }

  const result = await redeemCode(code, player.id)
  if (!result.ok) {
    return { ok: false as const, message: REDEEM_MESSAGES[result.reason] ?? 'Could not redeem that code.' }
  }

  revalidatePath('/redeem')
  revalidatePath('/')
  return {
    ok: true as const,
    sku: result.sku,
    offerName: offerName(result.sku),
    alreadyRedeemed: result.alreadyRedeemed,
    message: result.alreadyRedeemed
      ? `You've already unlocked ${offerName(result.sku)}.`
      : `Unlocked: ${offerName(result.sku)}.`,
  }
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
