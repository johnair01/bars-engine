/**
 * Your Collection — the post-login product hub (pure data).
 *
 * Derives a per-player view of every launch product from the single source of truth
 * (`LAUNCH_OFFERS`) plus the player's capabilities: which products they own, and where
 * to *open* the ones that have an in-app surface (the deck app, the downloads page).
 * No db / React here — `buildCollection` is a pure function over caps + admin.
 *
 * @see src/app/collection/page.tsx
 * @see src/lib/launch/offers.ts (the SKU registry)
 */

import { LAUNCH_OFFERS, type LaunchOffer, type OfferKey } from '@/lib/launch/offers'
import type { Capability } from '@/lib/launch/grants'

/**
 * Where an owned product opens. Absent ⇒ no post-login surface yet (physical goods,
 * the subscription, the bundle) — those are managed on /launch, not opened in-app.
 */
export const PRODUCT_OPEN: Partial<Record<OfferKey, { href: string; label: string }>> = {
  'deck-digital': { href: '/deck', label: 'Open the deck' },
  'book-digital': { href: '/downloads', label: 'Read / download' },
  'rpg-handbook-digital': { href: '/downloads', label: 'Download the handbook' },
}

/** Optional marketing page for a locked product (the deck has its own sales page). */
export const PRODUCT_LEARN: Partial<Record<OfferKey, string>> = {
  'deck-digital': '/deck/sales',
}

export interface CollectionEntry {
  offer: LaunchOffer
  /** Owned via an active entitlement capability, or admin bypass. */
  owned: boolean
  /** In-app destination when owned, or null for purchase-managed goods. */
  open: { href: string; label: string } | null
  /** Where the locked CTA points (deck → its sales page; everything else → /launch). */
  learnHref: string
}

/**
 * Resolve each launch product for a player. A product is owned when the player holds the
 * matching capability (a SKU always confers itself — see grants.ts) or is an admin.
 * Owned products sort first so the collection leads with what you can open.
 */
export function buildCollection(caps: Set<Capability>, isAdmin: boolean): CollectionEntry[] {
  const entries: CollectionEntry[] = LAUNCH_OFFERS.map((offer) => ({
    offer,
    owned: isAdmin || caps.has(offer.key as Capability),
    open: PRODUCT_OPEN[offer.key] ?? null,
    learnHref: PRODUCT_LEARN[offer.key] ?? '/launch',
  }))

  // Owned-and-openable first, then owned, then the rest — registry order within each band.
  const rank = (e: CollectionEntry) => (e.owned && e.open ? 0 : e.owned ? 1 : 2)
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i)
    .map(({ e }) => e)
}
