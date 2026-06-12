/**
 * Launch grant configuration — how each purchased SKU becomes app access.
 *
 * Pure data (no db, no server imports) so it is safe to import anywhere. The
 * entitlement service (src/lib/entitlements/service.ts) reads these to compute
 * expiry and capability, keyed to the OfferKey SKUs in offers.ts.
 */

import type { OfferKey } from '@/lib/launch/offers'

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
export const SKU_GRANTS: Record<OfferKey, GrantConfig> = {
  'book-digital': { grantType: 'timeboxed', durationDays: 30 },
  'rpg-handbook-digital': { grantType: 'perpetual' },
  'deck-digital': { grantType: 'perpetual' },
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

export const SKU_CAPABILITIES: Record<OfferKey, Capability[]> = {
  // Buying the digital book opens a (time-boxed) door into the app.
  'book-digital': ['app-access'],
  'rpg-handbook-digital': [],
  'deck-digital': [],
  // The game subscription includes the digital book + digital deck access.
  'game-subscription': ['app-access', 'book-digital', 'deck-digital'],
  'book-physical': [],
  'rpg-handbook-physical': [],
  // Founding Ally: lifetime app access + deck access (physical goods fulfilled separately).
  'founding-ally': ['app-access', 'deck-digital'],
}

/** All capabilities a SKU confers, including itself. */
export function capabilitiesForSku(sku: OfferKey): Capability[] {
  return [sku, ...(SKU_CAPABILITIES[sku] ?? [])]
}

/** Grant config for a SKU, defaulting to perpetual for unknown keys. */
export function grantForSku(sku: string): GrantConfig {
  return SKU_GRANTS[sku as OfferKey] ?? { grantType: 'perpetual' }
}
