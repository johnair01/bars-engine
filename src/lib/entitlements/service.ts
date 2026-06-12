/**
 * Entitlement service — the Track A commerce spine.
 *
 * Turns a purchase (Gumroad now, Stripe later) into in-app access:
 *   mintRedemptionCode → buyer redeems → grantEntitlement → capability checks.
 *
 * Server-only (imports the db client). Used by src/actions/entitlements.ts and
 * by feature-gating in server components. Not a "use server" file — it exports
 * helpers and types, the thin action wrappers live in src/actions/entitlements.ts.
 */

import { randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import type { OfferKey } from '@/lib/launch/offers'
import {
  capabilitiesForSku,
  grantForSku,
  type Capability,
} from '@/lib/launch/grants'

export interface GrantInput {
  playerId: string
  sku: OfferKey | string
  source?: string
  externalOrderId?: string | null
  /** Override start; defaults to now. */
  startsAt?: Date
}

/** Compute grant expiry from SKU config; perpetual ⇒ null. */
function computeExpiry(sku: string, from: Date): Date | null {
  const grant = grantForSku(sku)
  if (grant.grantType === 'perpetual' || !grant.durationDays) return null
  return new Date(from.getTime() + grant.durationDays * 24 * 60 * 60 * 1000)
}

/**
 * Create an entitlement for a player. Idempotent on (playerId, sku,
 * externalOrderId) when an order id is present, so replayed webhooks don't
 * double-grant.
 */
export async function grantEntitlement(input: GrantInput) {
  const { playerId, sku, source = 'gumroad', externalOrderId = null } = input
  const startsAt = input.startsAt ?? new Date()
  const grant = grantForSku(sku)
  const expiresAt = computeExpiry(sku, startsAt)

  if (externalOrderId) {
    const existing = await db.entitlement.findFirst({
      where: { playerId, sku, externalOrderId },
    })
    if (existing) return existing
  }

  return db.entitlement.create({
    data: {
      playerId,
      sku,
      grantType: grant.grantType,
      status: 'active',
      source,
      externalOrderId,
      startsAt,
      expiresAt,
    },
  })
}

/** Active, unexpired entitlements for a player. */
export async function getActiveEntitlements(playerId: string) {
  const now = new Date()
  return db.entitlement.findMany({
    where: {
      playerId,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
  })
}

/** Whether the player currently holds a capability (incl. bundled implications). */
export async function hasCapability(playerId: string, capability: Capability): Promise<boolean> {
  const active = await getActiveEntitlements(playerId)
  for (const ent of active) {
    if (capabilitiesForSku(ent.sku as OfferKey).includes(capability)) return true
  }
  return false
}

/** Convenience: does the player have any active app access right now? */
export function hasAppAccess(playerId: string): Promise<boolean> {
  return hasCapability(playerId, 'app-access')
}

// ── Redemption codes ──────────────────────────────────────────────────────

/** Human-enterable code, e.g. MAL-4F2A-9KQ7. */
function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I
  const bytes = randomBytes(8)
  let body = ''
  for (let i = 0; i < 8; i++) {
    body += alphabet[bytes[i] % alphabet.length]
    if (i === 3) body += '-'
  }
  return `MAL-${body}`
}

export interface MintInput {
  sku: OfferKey | string
  source?: string
  externalOrderId?: string | null
  /** Days the buyer has to claim the code; omitted ⇒ no claim deadline. */
  claimWindowDays?: number
}

/** Mint an unredeemed code for a purchase (webhook or admin). */
export async function mintRedemptionCode(input: MintInput) {
  const { sku, source = 'gumroad', externalOrderId = null, claimWindowDays } = input

  // Idempotency: one code per external order.
  if (externalOrderId) {
    const existing = await db.redemptionCode.findUnique({ where: { externalOrderId } })
    if (existing) return existing
  }

  const grant = grantForSku(sku)
  const expiresAt =
    claimWindowDays != null
      ? new Date(Date.now() + claimWindowDays * 24 * 60 * 60 * 1000)
      : null

  // Retry on the rare code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.redemptionCode.create({
        data: {
          code: generateCode(),
          sku,
          grantType: grant.grantType,
          grantDurationDays: grant.durationDays ?? null,
          source,
          externalOrderId,
          status: 'unredeemed',
          expiresAt,
        },
      })
    } catch (err) {
      if (attempt === 4) throw err // give up after collisions
    }
  }
  throw new Error('Failed to mint redemption code')
}

export type RedeemResult =
  | { ok: true; sku: string; alreadyRedeemed: boolean }
  | { ok: false; reason: 'not_found' | 'expired' | 'void' | 'claimed_by_other' }

/**
 * Redeem a code for a player: validates, creates the entitlement, and marks the
 * code redeemed — atomically. Idempotent if the same player re-redeems.
 */
export async function redeemCode(rawCode: string, playerId: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase()
  const rc = await db.redemptionCode.findUnique({ where: { code } })
  if (!rc) return { ok: false, reason: 'not_found' }

  if (rc.status === 'void') return { ok: false, reason: 'void' }

  if (rc.status === 'redeemed') {
    // Idempotent for the same player; otherwise it's spent.
    if (rc.redeemedByPlayerId === playerId) {
      return { ok: true, sku: rc.sku, alreadyRedeemed: true }
    }
    return { ok: false, reason: 'claimed_by_other' }
  }

  if (rc.expiresAt && rc.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  const redeemedAt = new Date()
  const expiresAt = computeExpiry(rc.sku, redeemedAt)

  await db.$transaction(async (tx) => {
    const entitlement = await tx.entitlement.create({
      data: {
        playerId,
        sku: rc.sku,
        grantType: rc.grantType,
        status: 'active',
        source: rc.source,
        externalOrderId: rc.externalOrderId,
        startsAt: redeemedAt,
        expiresAt,
      },
    })
    await tx.redemptionCode.update({
      where: { id: rc.id },
      data: {
        status: 'redeemed',
        redeemedByPlayerId: playerId,
        redeemedAt,
        entitlementId: entitlement.id,
      },
    })
  })

  return { ok: true, sku: rc.sku, alreadyRedeemed: false }
}
