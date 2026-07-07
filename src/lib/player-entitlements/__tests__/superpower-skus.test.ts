import { describe, it, expect } from 'vitest'

import { SUPERPOWERS } from '@/lib/technique-library'
import {
  superpowerPackSku,
  skuToSuperpower,
  isSuperpower,
  superpowersFromEntitlements,
  loadoutFromPlayer,
} from '../superpower-skus'

describe('superpower pack SKU round-trip', () => {
  it('maps every superpower to a pack sku and back', () => {
    for (const sp of SUPERPOWERS) {
      expect(skuToSuperpower(superpowerPackSku(sp))).toBe(sp)
    }
  })

  it('includes coach', () => {
    expect(superpowerPackSku('coach')).toBe('superpower-coach-pack')
    expect(skuToSuperpower('superpower-coach-pack')).toBe('coach')
  })

  it('rejects non-pack and unknown skus', () => {
    expect(skuToSuperpower('deck-digital')).toBeNull()
    expect(skuToSuperpower('superpower-wizard-pack')).toBeNull()
    expect(skuToSuperpower('superpower--pack')).toBeNull()
  })
})

describe('isSuperpower', () => {
  it('accepts members, rejects others', () => {
    expect(isSuperpower('connector')).toBe(true)
    expect(isSuperpower('coach')).toBe(true)
    expect(isSuperpower('wizard')).toBe(false)
    expect(isSuperpower(null)).toBe(false)
  })
})

describe('superpowersFromEntitlements', () => {
  it('extracts pack superpowers, dedupes, ignores non-pack and unknown', () => {
    const ents = [
      { sku: 'deck-digital' },
      { sku: 'superpower-connector-pack' },
      { sku: 'superpower-connector-pack' }, // dup
      { sku: 'superpower-coach-pack' },
      { sku: 'superpower-wizard-pack' }, // invalid
    ]
    expect(superpowersFromEntitlements(ents).sort()).toEqual(['coach', 'connector'])
  })

  it('returns [] for no pack entitlements', () => {
    expect(superpowersFromEntitlements([{ sku: 'deck-digital' }])).toEqual([])
  })
})

describe('loadoutFromPlayer', () => {
  it('builds a loadout when both slots are valid', () => {
    expect(loadoutFromPlayer({ superpowerInner: 'escape_artist', superpowerOuter: 'connector' })).toEqual({
      inner: 'escape_artist',
      outer: 'connector',
    })
  })

  it('returns null when a slot is missing or invalid', () => {
    expect(loadoutFromPlayer({ superpowerInner: 'connector', superpowerOuter: null })).toBeNull()
    expect(loadoutFromPlayer({ superpowerInner: null, superpowerOuter: null })).toBeNull()
    expect(loadoutFromPlayer({ superpowerInner: 'connector', superpowerOuter: 'wizard' })).toBeNull()
  })
})
