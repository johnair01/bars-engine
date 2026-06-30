/**
 * Superpower expansion-pack catalog + grant wiring (go-deeper Slice 3).
 * Spec: .specify/specs/go-deeper/tasks.md (T11–T13)
 */
import { describe, it, expect } from 'vitest'
import {
  LAUNCH_OFFERS,
  offersByGroup,
  offerByKey,
  offerHref,
  superpowerPackOfferKey,
  isOfferLive,
} from '../offers'
import { capabilitiesForSku, grantForSku } from '../grants'
import { SUPERPOWERS } from '@/lib/superpowers/types'
import { superpowerPackSku, skuToSuperpower } from '@/lib/player-entitlements/superpower-skus'

describe('superpower pack catalog', () => {
  it('every superpower (incl. coach) has a purchasable pack — no second-class slot', () => {
    for (const sp of SUPERPOWERS) {
      const offer = offerByKey(superpowerPackOfferKey(sp))
      expect(offer, `missing pack for ${sp}`).toBeDefined()
      expect(offer!.group).toBe('digital')
    }
    expect(SUPERPOWERS).toContain('coach')
  })

  it('pack OfferKey is byte-identical to the entitlement pack SKU', () => {
    for (const sp of SUPERPOWERS) {
      expect(superpowerPackOfferKey(sp)).toBe(superpowerPackSku(sp))
      expect(skuToSuperpower(superpowerPackOfferKey(sp))).toBe(sp)
    }
  })

  it('exposes a single loadout bundle', () => {
    const bundles = offersByGroup('bundle').map((o) => o.key)
    expect(bundles).toContain('loadout-bundle')
  })
})

describe('pack + bundle grants', () => {
  it('packs and the bundle grant perpetually', () => {
    expect(grantForSku(superpowerPackSku('coach')).grantType).toBe('perpetual')
    expect(grantForSku('loadout-bundle').grantType).toBe('perpetual')
  })

  it('a pack confers only itself (the capability→Superpower bridge is the SKU)', () => {
    const sku = superpowerPackOfferKey('connector')
    expect(capabilitiesForSku(sku)).toEqual([sku])
  })

  it('the loadout bundle confers deck access', () => {
    expect(capabilitiesForSku('loadout-bundle')).toContain('deck-digital')
  })
})

describe('offerHref (upsell resolution)', () => {
  it('falls back to an anchored /launch link when Gumroad is unwired', () => {
    const sku = superpowerPackSku('strategist')
    const offer = offerByKey(sku)!
    if (!isOfferLive(offer)) {
      expect(offerHref(sku)).toBe(`/launch#${sku}`)
    }
  })
})

describe('catalog integrity', () => {
  it('keys are unique across the whole registry', () => {
    const keys = LAUNCH_OFFERS.map((o) => o.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
