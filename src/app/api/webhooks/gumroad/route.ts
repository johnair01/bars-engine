/**
 * Gumroad sale webhook (Track A delivery).
 *
 * Configure in Gumroad as the product/seller "Ping" URL, with the shared secret
 * in the query string:  https://<app>/api/webhooks/gumroad?token=<GUMROAD_WEBHOOK_SECRET>
 *
 * On a sale we mint a RedemptionCode keyed to the Gumroad sale id (idempotent).
 * If the product has license keys enabled (recommended — it's how the buyer
 * receives their code with no email infra on our side), the license key becomes
 * the redemption code; otherwise we generate one. On refund/dispute we void the
 * code and revoke the entitlement.
 *
 * Buyers redeem at /redeem.
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import {
  mintRedemptionCode,
  revokeByExternalOrderId,
  extendSubscription,
  endSubscription,
} from '@/lib/entitlements/service'
import { resolveSkuFromGumroad } from '@/lib/launch/gumroad'
import { grantForSku } from '@/lib/launch/grants'
import { wallForSku, parseGumroadPriceCents } from '@/lib/launch/barn-credit'
import { creditBarnWallAnon } from '@/actions/barn'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function secretOk(req: NextRequest): boolean {
  const expected = process.env.GUMROAD_WEBHOOK_SECRET
  if (!expected) return false // not configured ⇒ reject (fail closed)
  const provided =
    req.nextUrl.searchParams.get('token') ?? req.headers.get('x-gumroad-token') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!secretOk(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }
  const get = (k: string): string | null => {
    const v = form.get(k)
    return typeof v === 'string' ? v : null
  }

  // Optional seller pinning.
  const expectedSeller = process.env.GUMROAD_SELLER_ID
  if (expectedSeller && get('seller_id') && get('seller_id') !== expectedSeller) {
    return NextResponse.json({ ok: false, error: 'wrong_seller' }, { status: 401 })
  }

  try {
    const subscriptionId = get('subscription_id')

    // Subscription ended (final: failed payment / period ended / cancellation now
    // in effect) → cut access immediately.
    if (subscriptionId && (get('ended_reason') || get('subscription_ended_at'))) {
      const ended = await endSubscription(subscriptionId)
      return NextResponse.json({
        ok: true,
        action: 'subscription_ended',
        reason: get('ended_reason'),
        ended,
      })
    }
    // Plain cancellation that still has paid time left → graceful: keep access
    // until the entitlement lapses at its expiry (no more renewals will arrive).
    if (subscriptionId && (get('cancelled') === 'true' || get('cancelled_at'))) {
      return NextResponse.json({ ok: true, action: 'cancellation_noted' })
    }

    // Everything below is a sale-shaped event and needs an order id.
    const saleId = get('sale_id') ?? get('order_number')
    if (!saleId) {
      // Not a ping we handle — acknowledge so Gumroad stops retrying.
      return NextResponse.json({ ok: true, action: 'ignored_no_sale_id' })
    }

    // Refund / chargeback → void + revoke.
    if (get('refunded') === 'true' || get('disputed') === 'true') {
      await revokeByExternalOrderId(saleId)
      return NextResponse.json({ ok: true, action: 'revoked' })
    }

    const sku = resolveSkuFromGumroad({
      productPermalink: get('product_permalink'),
      permalink: get('permalink'),
      productId: get('product_id'),
      productName: get('product_name'),
    })
    if (!sku) {
      // Unrecognized product — acknowledge so Gumroad stops retrying.
      console.warn('[gumroad] unrecognized product', {
        permalink: get('product_permalink'),
        productId: get('product_id'),
        productName: get('product_name'),
      })
      return NextResponse.json({ ok: true, action: 'ignored_unrecognized_product' })
    }

    // Recurring renewal charge → extend the existing entitlement, don't re-mint.
    // (Renewals are recurring patronage — a future "runway" wall credit, not pre-sale —
    // so they intentionally do not touch the barn here.)
    if (subscriptionId && get('is_recurring_charge') === 'true') {
      const days = grantForSku(sku).durationDays ?? 30
      const extended = await extendSubscription(subscriptionId, days)
      return NextResponse.json({ ok: true, action: 'renewed', sku, extended })
    }

    // Sale-time barn bridge (idempotent): a recognized sale raises the pre-sale wall once.
    // Anchor idempotency on the RedemptionCode (unique per externalOrderId) — only the
    // first delivery of this sale (before its code exists) credits the wall. Gumroad
    // retries sequentially, so the pre-check is a sound once-only guard.
    const alreadyMinted = await db.redemptionCode.findUnique({
      where: { externalOrderId: saleId },
      select: { id: true },
    })

    const rc = await mintRedemptionCode({
      sku,
      source: 'gumroad',
      externalOrderId: saleId,
      subscriptionId,
      code: get('license_key'),
    })

    let barnCredited = false
    if (!alreadyMinted) {
      const cents = parseGumroadPriceCents(get('price'))
      if (cents) {
        try {
          const credited = await creditBarnWallAnon(wallForSku(sku), cents / 100)
          if (credited) {
            barnCredited = true
            revalidatePath('/event/barn')
            revalidatePath('/launch')
          }
        } catch (e) {
          // Never fail the sale on a barn-credit hiccup — the entitlement is what matters.
          console.warn('[gumroad] barn credit failed', e)
        }
      }
    }

    return NextResponse.json({ ok: true, action: 'minted', sku, status: rc.status, barnCredited })
  } catch (err) {
    // 500 ⇒ Gumroad retries (good for transient DB errors).
    console.error('[gumroad] webhook error', err)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
}
