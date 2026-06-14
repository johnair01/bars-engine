/**
 * Gumroad mapping — resolve an incoming Gumroad sale to one of our OfferKey SKUs.
 *
 * Pure/server-safe (reads env, no db). Used by the Gumroad webhook
 * (src/app/api/webhooks/gumroad/route.ts).
 *
 * Product → SKU resolution, in priority order:
 *   1. GUMROAD_PRODUCT_MAP env — JSON object mapping any Gumroad identifier
 *      (permalink, product_id, or product_name) to an OfferKey. Highest priority.
 *   2. Permalinks derived from the NEXT_PUBLIC_GUMROAD_*_URL product links
 *      already configured for the /launch page (last path segment).
 */

import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

const OFFER_KEYS = new Set<string>(LAUNCH_OFFERS.map((o) => o.key))

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase()
}

/** Last path segment of a Gumroad product URL, e.g. ".../l/abcde" → "abcde". */
function permalinkOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    return seg ? seg.toLowerCase() : null
  } catch {
    return null
  }
}

let cached: Map<string, OfferKey> | null = null

/** Build the identifier → OfferKey map once. */
function buildMap(): Map<string, OfferKey> {
  if (cached) return cached
  const map = new Map<string, OfferKey>()

  // Source 2 (lower priority): derive permalinks from the configured product URLs.
  const urlByKey: Partial<Record<OfferKey, string | undefined>> = {
    'book-digital': process.env.NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL,
    'rpg-handbook-digital': process.env.NEXT_PUBLIC_GUMROAD_RPG_DIGITAL_URL,
    'deck-digital': process.env.NEXT_PUBLIC_GUMROAD_DECK_DIGITAL_URL,
    'game-subscription': process.env.NEXT_PUBLIC_GUMROAD_GAME_SUB_URL,
    'book-physical': process.env.NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL,
    'rpg-handbook-physical': process.env.NEXT_PUBLIC_GUMROAD_RPG_PHYSICAL_URL,
    'founding-ally': process.env.NEXT_PUBLIC_GUMROAD_FOUNDING_ALLY_URL,
  }
  for (const [key, url] of Object.entries(urlByKey)) {
    const pl = permalinkOf(url)
    if (pl) map.set(pl, key as OfferKey)
  }

  // Source 1 (higher priority): explicit override map.
  const raw = process.env.GUMROAD_PRODUCT_MAP
  if (raw) {
    try {
      const obj = JSON.parse(raw) as Record<string, string>
      for (const [identifier, sku] of Object.entries(obj)) {
        if (OFFER_KEYS.has(sku)) map.set(norm(identifier), sku as OfferKey)
      }
    } catch {
      // Malformed map env is ignored — derived permalinks still apply.
    }
  }

  cached = map
  return map
}

export interface GumroadProductFields {
  productPermalink?: string | null
  permalink?: string | null
  productId?: string | null
  productName?: string | null
}

/** Resolve a Gumroad sale's product to an OfferKey, or null if unrecognized. */
export function resolveSkuFromGumroad(fields: GumroadProductFields): OfferKey | null {
  const map = buildMap()
  const candidates = [
    permalinkOf(fields.productPermalink ?? undefined),
    norm(fields.productPermalink),
    norm(fields.permalink),
    norm(fields.productId),
    norm(fields.productName),
  ].filter(Boolean) as string[]

  for (const c of candidates) {
    const hit = map.get(c)
    if (hit) return hit
  }
  return null
}
