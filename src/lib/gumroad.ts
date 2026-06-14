/**
 * Gumroad license verification — the only Gumroad I/O surface.
 *
 * The book is sold on Gumroad; each sale auto-issues a unique license key.
 * We verify that key server-side via Gumroad's `v2/licenses/verify` API and
 * turn a valid purchase into a BookEntitlement (see book-launch-paywall spec).
 *
 * Isolated here so it can be mock-mode flagged (GUMROAD_VERIFY_MODE=mock) for
 * tests, the verification quest, and local dev without a real sale.
 */

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify'

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
 */
export async function verifyLicense(
  licenseKey: string,
  opts?: { increment?: boolean }
): Promise<VerifyResult> {
  const key = licenseKey.trim()
  if (!key) return { ok: false, reason: 'invalid' }

  if ((process.env.GUMROAD_VERIFY_MODE ?? 'live') === 'mock') {
    return verifyMock(key)
  }

  const productId = process.env.GUMROAD_PRODUCT_ID
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
