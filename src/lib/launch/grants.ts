/**
 * Launch grant configuration — how each purchased SKU becomes app access.
 *
 * Pure data (no db, no server imports) so it is safe to import anywhere. The
 * entitlement service (src/lib/entitlements/service.ts) reads these to compute
 * expiry and capability, keyed to the OfferKey SKUs in offers.ts.
 */

import type { CoreOfferKey, OfferKey } from '@/lib/launch/offers'
import { skuToSuperpower } from '@/lib/player-entitlements/superpower-skus'

export type GrantType = 'perpetual' | 'timeboxed' | 'subscription'

export interface GrantConfig {
  grantType: GrantType
  /** Days the grant lasts from redemption; omitted ⇒ perpetual. */
  durationDays?: number
}

/**
 * What an entitlement grants in time. The digital book is the funnel hook:
 * buying it opens a 30-day window into the app.
 */
export const SKU_GRANTS: Record<CoreOfferKey, GrantConfig> = {
  'book-digital': { grantType: 'timeboxed', durationDays: 30 },
  'rpg-handbook-digital': { grantType: 'perpetual' },
  'deck-digital': { grantType: 'perpetual' },
  'deck-physical': { grantType: 'perpetual' }, // entitlement = fulfillment record
  'game-subscription': { grantType: 'subscription', durationDays: 30 },
  'book-physical': { grantType: 'perpetual' }, // entitlement = fulfillment record
  'rpg-handbook-physical': { grantType: 'perpetual' }, // entitlement = fulfillment record
  'founding-ally': { grantType: 'perpetual' }, // lifetime app access
}

/**
 * Capabilities a granted SKU confers. A capability is either another OfferKey
 * (e.g. the game subscription confers deck-digital access) or the special
 * 'app-access' capability that gates entry to the app's paid goodies.
 *
 * A SKU always confers itself; this map adds the bundled extras.
 */
export type Capability = OfferKey | 'app-access'

export const SKU_CAPABILITIES: Record<CoreOfferKey, Capability[]> = {
  // Buying the digital book opens a (time-boxed) door into the app.
  'book-digital': ['app-access'],
  'rpg-handbook-digital': [],
  'deck-digital': [],
  // Physical deck buyers also get the matching digital deck access.
  'deck-physical': ['deck-digital'],
  // The game subscription includes the digital book + digital deck access.
  'game-subscription': ['app-access', 'book-digital', 'deck-digital'],
  // Physical buyers also get the matching digital file to download.
  'book-physical': ['book-digital'],
  'rpg-handbook-physical': ['rpg-handbook-digital'],
  // Founding Ally: lifetime app access + every digital file.
  'founding-ally': ['app-access', 'deck-digital', 'book-digital', 'rpg-handbook-digital'],
}

/**
 * All capabilities a SKU confers, including itself.
 *
 * Superpower packs confer themselves — `getOwnedSuperpowers` derives the player's
 * powers from the held pack SKUs via `skuToSuperpower` (the capability→Superpower
 * bridge), so no separate map is needed. The loadout bundle confers deck access;
 * its two packs are resolved from the player's saved loadout at redemption.
 */
export function capabilitiesForSku(sku: OfferKey): Capability[] {
  if (skuToSuperpower(sku)) return [sku] // pack confers itself
  if (sku === 'loadout-bundle') return [sku, 'deck-digital']
  return [sku, ...(SKU_CAPABILITIES[sku as CoreOfferKey] ?? [])]
}

/**
 * Grant config for a SKU, defaulting to perpetual for unknown keys.
 *
 * Packs + the loadout bundle are perpetual. SINGLE-CHARGE invariant: granting a
 * pack SKU is idempotent (the entitlement service de-dupes by SKU), so a player
 * whose inner pack was auto-granted on quiz completion and who later buys the
 * loadout bundle is not double-granted — the bundle credits the prior grant.
 */
export function grantForSku(sku: string): GrantConfig {
  if (skuToSuperpower(sku) || sku === 'loadout-bundle') return { grantType: 'perpetual' }
  return SKU_GRANTS[sku as CoreOfferKey] ?? { grantType: 'perpetual' }
}
