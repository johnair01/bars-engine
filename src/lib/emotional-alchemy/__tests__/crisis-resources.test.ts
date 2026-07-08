import { describe, it, expect } from 'vitest'

import { crisisResources, CRISIS_US, CRISIS_INTERNATIONAL } from '../index'

describe('crisis resources (S2 — not US-only, not hardcoded in components)', () => {
  it('always includes the US line AND an always-valid international fallback', () => {
    const r = crisisResources()
    expect(r).toContain(CRISIS_US)
    expect(r).toContain(CRISIS_INTERNATIONAL)
    // no player is stranded: the international entry is a universally-valid contact
    expect(CRISIS_INTERNATIONAL.contact.toLowerCase()).toContain('local emergency')
  })
})
