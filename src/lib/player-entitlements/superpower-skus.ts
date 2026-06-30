/**
 * Pure helpers for superpower pack SKUs and loadout mapping.
 * Spec: .specify/specs/go-deeper/spec.md (Slice 1)
 *
 * No I/O — safe to unit-test and import anywhere. Ownership of a superpower pack
 * is derived from the Entitlement.sku pattern `superpower-<sp>-pack`, which keeps
 * this decoupled from `offers.ts` (whose pack OfferKeys land in Slice 3 / at the
 * branch merge per the reconciliation doc).
 */

import { SUPERPOWERS, type Superpower, type Loadout } from '@/lib/technique-library'

/** Canonical pack SKU for a superpower, e.g. 'connector' -> 'superpower-connector-pack'. */
export function superpowerPackSku(sp: Superpower): string {
  return `superpower-${sp}-pack`
}

const PACK_SKU_RE = /^superpower-(.+)-pack$/

export function isSuperpower(value: unknown): value is Superpower {
  return typeof value === 'string' && (SUPERPOWERS as readonly string[]).includes(value)
}

/** Reverse a pack SKU to its Superpower, or null if it isn't a (valid) pack SKU. */
export function skuToSuperpower(sku: string): Superpower | null {
  const m = PACK_SKU_RE.exec(sku)
  if (!m) return null
  return isSuperpower(m[1]) ? m[1] : null
}

/** Map a set of entitlement-like rows to the superpowers their pack SKUs grant (deduped). */
export function superpowersFromEntitlements(entitlements: ReadonlyArray<{ sku: string }>): Superpower[] {
  const out: Superpower[] = []
  for (const e of entitlements) {
    const sp = skuToSuperpower(e.sku)
    if (sp && !out.includes(sp)) out.push(sp)
  }
  return out
}

/** Build a Loadout from raw Player fields, or null if either slot is missing/invalid. */
export function loadoutFromPlayer(p: {
  superpowerInner?: string | null
  superpowerOuter?: string | null
}): Loadout | null {
  if (isSuperpower(p.superpowerInner) && isSuperpower(p.superpowerOuter)) {
    return { inner: p.superpowerInner, outer: p.superpowerOuter }
  }
  return null
}
