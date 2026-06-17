/**
 * Launch → barn bridge (pure helpers).
 *
 * The Gumroad launch funnel (offers.ts) is the real, card-charging checkout. These
 * pure helpers let the Gumroad webhook raise the July-18 barn's pre-sale wall on a
 * sale, with no db/server imports so they can be unit-tested in isolation.
 *
 * @see src/app/api/webhooks/gumroad/route.ts (caller)
 * @see .specify/specs/barn-raising-live-data/spec.md (the barn it feeds)
 */

import type { OfferKey } from '@/lib/launch/offers'
import type { WallKey } from '@/lib/event/barn-raising'

/**
 * Which barn wall a launch SKU's revenue raises. Every launch sale is *commerce* —
 * a pre-sale of a product — so it feeds the **pre-sale** wall. The gift (`car`) and
 * patronage (`runway`) walls are fed by the donate path, not product sales. Kept as a
 * function (not a bare constant) so a future SKU→wall split (e.g. recurring → runway)
 * has one place to live.
 */
export function wallForSku(_sku: OfferKey | string): WallKey {
  return 'presale'
}

/**
 * Parse Gumroad's `price` field → integer **cents**. Gumroad sends the amount paid in
 * cents (e.g. "1500"); PWYW reflects the actual amount the buyer named. We also tolerate
 * a dollar-formatted value (e.g. "15.00") defensively. Returns `null` when absent,
 * zero, or unparseable (free downloads / malformed) so the caller can skip crediting.
 */
export function parseGumroadPriceCents(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  if (s.includes('.')) {
    const dollars = Number.parseFloat(s)
    if (!Number.isFinite(dollars) || dollars <= 0) return null
    return Math.round(dollars * 100)
  }
  const cents = Number.parseInt(s, 10)
  if (!Number.isFinite(cents) || cents <= 0) return null
  return cents
}
