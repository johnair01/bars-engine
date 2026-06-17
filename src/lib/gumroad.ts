/**
 * Gumroad license verification — the only Gumroad I/O surface.
 *
 * Each launch SKU is sold on Gumroad; a sale auto-issues a unique license key.
 * We verify that key server-side via Gumroad's `v2/licenses/verify` API and turn
 * a valid purchase into an `Entitlement` (see launch-paywall-integration spec).
 *
 * Per-SKU products: the product id is resolved from `GUMROAD_PRODUCT_ID_<SKU>`
 * (e.g. `GUMROAD_PRODUCT_ID_DECK_DIGITAL`); `book-digital` also honours the
 * legacy `GUMROAD_PRODUCT_ID`. `resolveLicense` probes a bare key across every
 * configured SKU so /redeem can verify a license whose sale webhook never fired.
 *
 * Isolated here so it can be mock-mode flagged (GUMROAD_VERIFY_MODE=mock) for
 * tests, the verification quest, and local dev without a real sale.
 */

import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify'

/** Env var holding a SKU's Gumroad product id, e.g. GUMROAD_PRODUCT_ID_DECK_DIGITAL. */
function envKeyForSku(sku: OfferKey): string {
  return `GUMROAD_PRODUCT_ID_${sku.toUpperCase().replace(/-/g, '_')}`
}

/** The configured Gumroad product id for a SKU, if any. */
function productIdForSku(sku: OfferKey): string | undefined {
  const specific = process.env[envKeyForSku(sku)]?.trim()
  if (specific) return specific
  // book-digital keeps the original single-product env for back-compat.
  if (sku === 'book-digital') return process.env.GUMROAD_PRODUCT_ID?.trim() || undefined
  return undefined
}

/** SKUs that have a Gumroad product id wired, in registry order. */
function skusWithProduct(): OfferKey[] {
  return LAUNCH_OFFERS.map((o) => o.key).filter((k) => productIdForSku(k) !== undefined)
}

export type VerifyResult =
  | { ok: true; saleId: string; uses: number; email?: string; refunded: boolean }
  | { ok: false; reason: 'invalid' | 'refunded' | 'over_uses' | 'config' | 'network' }

function maxUses(): number {
  const raw = process.env.GUMROAD_MAX_USES
  const n = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 3
}

/**
 * Verify a Gumroad license key for the configured book product.
 *
 * @param licenseKey The key the buyer received from Gumroad.
 * @param opts.increment Whether to increment Gumroad's `uses` counter.
 *   Pass `true` on first redemption; `false` on re-checks (gate) so only
 *   redemptions count against the share cap.
 * @param opts.sku Which SKU's Gumroad product to verify against. Omitted ⇒ the
 *   legacy single book product (`GUMROAD_PRODUCT_ID`).
 */
export async function verifyLicense(
  licenseKey: string,
  opts?: { increment?: boolean; sku?: OfferKey }
): Promise<VerifyResult> {
  const key = licenseKey.trim()
  if (!key) return { ok: false, reason: 'invalid' }

  if ((process.env.GUMROAD_VERIFY_MODE ?? 'live') === 'mock') {
    return verifyMock(key)
  }

  const productId = opts?.sku ? productIdForSku(opts.sku) : process.env.GUMROAD_PRODUCT_ID?.trim()
  if (!productId) return { ok: false, reason: 'config' }

  let json: GumroadVerifyResponse
  try {
    const res = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: productId,
        license_key: key,
        increment_uses_count: String(opts?.increment ?? false),
      }),
      cache: 'no-store',
    })
    json = (await res.json()) as GumroadVerifyResponse
  } catch {
    return { ok: false, reason: 'network' }
  }

  if (!json.success || !json.purchase) return { ok: false, reason: 'invalid' }

  const p = json.purchase
  if (p.refunded || p.disputed || p.chargebacked) {
    return { ok: false, reason: 'refunded' }
  }
  if (typeof json.uses === 'number' && json.uses > maxUses()) {
    return { ok: false, reason: 'over_uses' }
  }

  return {
    ok: true,
    saleId: p.sale_id ?? p.id ?? key,
    uses: json.uses ?? 0,
    email: p.email,
    refunded: false,
  }
}

export type ResolveResult =
  | { matched: true; sku: OfferKey; result: VerifyResult }
  | { matched: false }

/**
 * Probe a raw Gumroad license key against every SKU with a configured product
 * id and return the first it belongs to. A key valid for a product but refunded
 * / over-used is still a match (so the caller can surface that reason); a key
 * `invalid` for a product just means "wrong product — keep looking".
 *
 * Used by /redeem as a fallback when no minted RedemptionCode exists (the sale
 * webhook misfired). Probing with `increment` only bumps the use counter on the
 * product the key actually belongs to — wrong products return `invalid` and
 * never increment.
 */
export async function resolveLicense(
  licenseKey: string,
  opts?: { increment?: boolean }
): Promise<ResolveResult> {
  const key = licenseKey.trim()
  if (!key) return { matched: false }
  const increment = opts?.increment ?? true

  if ((process.env.GUMROAD_VERIFY_MODE ?? 'live') === 'mock') {
    const result = verifyMock(key)
    if (result.ok) return { matched: true, sku: mockSkuFor(key), result }
    if (result.reason === 'refunded') return { matched: true, sku: mockSkuFor(key), result }
    return { matched: false }
  }

  for (const sku of skusWithProduct()) {
    const result = await verifyLicense(key, { increment, sku })
    if (result.ok) return { matched: true, sku, result }
    // Belongs to this product but isn't redeemable — stop and surface why.
    if (result.reason === 'refunded' || result.reason === 'over_uses') {
      return { matched: true, sku, result }
    }
    // 'invalid' (wrong product) / 'network' / 'config' → try the next product.
  }
  return { matched: false }
}

/** Map a mock key to a SKU: `TEST-<sku>-…` targets one; otherwise the book. */
function mockSkuFor(key: string): OfferKey {
  const captured = key.match(/^TEST-(.+)-/i)?.[1]?.toLowerCase()
  const hit = LAUNCH_OFFERS.find((o) => o.key === captured)
  return hit ? hit.key : 'book-digital'
}

/**
 * Deterministic mock for tests / cert / local dev.
 * `TEST-…` keys verify; `REFUND-…` keys read as refunded; anything else invalid.
 */
function verifyMock(key: string): VerifyResult {
  if (key.startsWith('REFUND-')) return { ok: false, reason: 'refunded' }
  if (key.startsWith('TEST-')) {
    return { ok: true, saleId: `mock_${key}`, uses: 1, email: 'mock@example.com', refunded: false }
  }
  return { ok: false, reason: 'invalid' }
}

interface GumroadVerifyResponse {
  success: boolean
  uses?: number
  purchase?: {
    id?: string
    sale_id?: string
    email?: string
    refunded?: boolean
    disputed?: boolean
    chargebacked?: boolean
  }
}
