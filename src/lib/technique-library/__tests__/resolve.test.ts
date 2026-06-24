import { describe, it, expect } from 'vitest'

import { resolveTechniques, aspectForSubject, type ResolvableCard } from '../resolve'
import {
  channelsForCapabilities,
  emotionForChannel,
  satisfactionForChannel,
  channelForCapability,
  type Loadout,
} from '../vocabulary'
import type { Technique } from '../types'

const CARD: ResolvableCard = {
  move: 'clean_up',
  operation: 'architect',
  domain: 'GATHERING_RESOURCES',
  capabilities: ['agency', 'connection'], // -> channels fire, water
}

const LOADOUT: Loadout = { inner: 'escape_artist', outer: 'connector' }

function tech(partial: Partial<Technique>): Technique {
  return {
    id: partial.id ?? 'x',
    slug: partial.slug ?? 'x',
    name: partial.name ?? 'X',
    essence: 'e',
    steps: ['s'],
    source: { origin: 'gm' },
    moves: partial.moves ?? ['clean_up'],
    operations: partial.operations ?? [],
    domains: partial.domains ?? [],
    channels: partial.channels ?? [],
    aspect: partial.aspect ?? 'both',
    superpowers: partial.superpowers ?? [],
    tier: partial.tier ?? 'community',
    status: 'published',
    ...partial,
  }
}

describe('channel helpers', () => {
  it('maps capabilities to channels via the Rosetta table', () => {
    expect(channelsForCapabilities(['agency', 'connection'])).toEqual(['fire', 'water'])
    expect(channelForCapability('exploration')).toBe('metal')
    expect(emotionForChannel('fire')).toBe('Anger')
    expect(satisfactionForChannel('fire')).toBe('Triumph')
  })
})

describe('resolveTechniques matching predicate', () => {
  it('filters by move', () => {
    const pool = [tech({ id: 'wake', moves: ['wake_up'] }), tech({ id: 'clean', moves: ['clean_up'] })]
    const ids = resolveTechniques(CARD, LOADOUT, 'self', pool).map((r) => r.technique.id)
    expect(ids).toContain('clean')
    expect(ids).not.toContain('wake')
  })

  it('filters by operation (altitude)', () => {
    const pool = [tech({ id: 'shaman', operations: ['shaman'] }), tech({ id: 'arch', operations: ['architect'] })]
    const ids = resolveTechniques(CARD, LOADOUT, 'self', pool).map((r) => r.technique.id)
    expect(ids).toEqual(['arch'])
  })

  it('filters by domain', () => {
    const pool = [tech({ id: 'gr', domains: ['GATHERING_RESOURCES'] }), tech({ id: 'da', domains: ['DIRECT_ACTION'] })]
    const ids = resolveTechniques(CARD, LOADOUT, 'self', pool).map((r) => r.technique.id)
    expect(ids).toEqual(['gr'])
  })

  it('filters by channel (via card capabilities)', () => {
    const pool = [tech({ id: 'fire', channels: ['fire'] }), tech({ id: 'metal', channels: ['metal'] })]
    const ids = resolveTechniques(CARD, LOADOUT, 'self', pool).map((r) => r.technique.id)
    expect(ids).toContain('fire')
    expect(ids).not.toContain('metal')
  })

  it('treats empty tag arrays as wildcards', () => {
    const pool = [tech({ id: 'wild', moves: [], operations: [], domains: [], channels: [] })]
    expect(resolveTechniques(CARD, LOADOUT, 'self', pool)).toHaveLength(1)
  })
})

describe('aspect / subject swap', () => {
  it('maps subject to aspect', () => {
    expect(aspectForSubject('self')).toBe('inner')
    expect(aspectForSubject('other')).toBe('outer')
    expect(aspectForSubject('collective')).toBe('outer')
  })

  it('inner-only technique surfaces for self, not other', () => {
    const pool = [tech({ id: 'inner', aspect: 'inner' })]
    expect(resolveTechniques(CARD, LOADOUT, 'self', pool)).toHaveLength(1)
    expect(resolveTechniques(CARD, LOADOUT, 'other', pool)).toHaveLength(0)
  })
})

describe('superpower / loadout filtering', () => {
  it('active outer-slot superpower surfaces via outer when subject is other', () => {
    const pool = [tech({ id: 'conn', superpowers: ['connector'] })]
    const self = resolveTechniques(CARD, LOADOUT, 'self', pool)
    const other = resolveTechniques(CARD, LOADOUT, 'other', pool)
    expect(self).toHaveLength(0) // inner slot is escape_artist
    expect(other).toHaveLength(1)
    expect(other[0]?.viaSlot).toBe('outer')
  })

  it('alchemist is the universal substrate (eligible under any loadout, viaSlot substrate)', () => {
    const pool = [tech({ id: 'alch', superpowers: ['alchemist'] })]
    const self = resolveTechniques(CARD, LOADOUT, 'self', pool)
    const other = resolveTechniques(CARD, LOADOUT, 'other', pool)
    expect(self[0]?.viaSlot).toBe('substrate')
    expect(other[0]?.viaSlot).toBe('substrate')
  })

  it('non-matching superpower without alchemist is excluded', () => {
    const pool = [tech({ id: 'dis', superpowers: ['disruptor'] })]
    expect(resolveTechniques(CARD, LOADOUT, 'self', pool)).toHaveLength(0)
  })
})

describe('ranking', () => {
  it('orders by specificity, then tier (canonical first)', () => {
    const pool = [
      tech({ id: 'broad', moves: ['clean_up'], tier: 'community' }),
      tech({
        id: 'specific',
        moves: ['clean_up'],
        operations: ['architect'],
        domains: ['GATHERING_RESOURCES'],
        tier: 'personal',
      }),
      tech({ id: 'broad-canon', moves: ['clean_up'], tier: 'canonical' }),
    ]
    const ids = resolveTechniques(CARD, LOADOUT, 'self', pool).map((r) => r.technique.id)
    expect(ids[0]).toBe('specific') // highest score
    expect(ids[1]).toBe('broad-canon') // tie on score, canonical beats community
    expect(ids[2]).toBe('broad')
  })

  it('respects limit', () => {
    const pool = [tech({ id: 'a' }), tech({ id: 'b' }), tech({ id: 'c' })]
    expect(resolveTechniques(CARD, LOADOUT, 'self', pool, 2)).toHaveLength(2)
  })
})
