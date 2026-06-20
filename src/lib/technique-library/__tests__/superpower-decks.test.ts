import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SUPERPOWERS, type Loadout } from '../vocabulary'
import { validateTechnique } from '../validate'
import { CANONICAL_TECHNIQUES } from '../canonical'
import { resolveTechniques, type ResolvableCard } from '../resolve'
import {
  superpowerDeck,
  publishedDeck,
  poolWithSuperpowers,
  citeSuperpowerMove,
} from '../superpowers'

const SAMPLE: ResolvableCard = {
  move: 'open_up',
  operation: 'diplomat',
  domain: 'DIRECT_ACTION',
  capabilities: ['connection'],
}
const LOADOUT: Loadout = { inner: 'escape_artist', outer: 'connector' }

describe('each superpower deck is a complete 60-cell grid', () => {
  it.each(SUPERPOWERS.map((sp) => [sp] as const))('%s = 60 unique cells (30 inner / 30 outer)', (sp) => {
    const deck = superpowerDeck(sp)
    expect(deck).toHaveLength(60)
    expect(new Set(deck.map((c) => `${c.moves[0]}|${c.operations[0]}|${c.aspect}`)).size).toBe(60)
    expect(new Set(deck.map((c) => c.id)).size).toBe(60)
    expect(deck.filter((c) => c.aspect === 'inner')).toHaveLength(30)
    expect(deck.filter((c) => c.aspect === 'outer')).toHaveLength(30)
  })

  it('ids are unique across all six decks', () => {
    const all = SUPERPOWERS.flatMap((sp) => superpowerDeck(sp).map((c) => c.id))
    expect(new Set(all).size).toBe(all.length)
    expect(all).toHaveLength(360)
  })
})

describe('all generated cards are valid', () => {
  it('every card passes validateTechnique', () => {
    for (const sp of SUPERPOWERS) {
      for (const c of superpowerDeck(sp)) {
        const r = validateTechnique(c)
        expect(r.ok, r.ok ? c.id : `${c.id}: ${r.errors.join(', ')}`).toBe(true)
      }
    }
  })
})

describe('base isolation', () => {
  it('no pack cards leak into the base pool', () => {
    expect(CANONICAL_TECHNIQUES.some((t) => t.id.startsWith('sp-'))).toBe(false)
  })

  it('base allyship deck stays 120 move cards', () => {
    const deck = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json'), 'utf8'),
    ) as { cards: Array<{ kind: string }> }
    expect(deck.cards.filter((c) => c.kind === 'move')).toHaveLength(120)
  })
})

describe('ownership-gated resolution', () => {
  it('owned pack surfaces a class card; unowned does not', () => {
    const owned = poolWithSuperpowers(CANONICAL_TECHNIQUES, ['connector'], { includeDrafts: true })
    const none = poolWithSuperpowers(CANONICAL_TECHNIQUES, [], { includeDrafts: true })
    const withPack = resolveTechniques(SAMPLE, LOADOUT, 'other', owned).filter((r) =>
      r.technique.superpowers.includes('connector'),
    )
    const without = resolveTechniques(SAMPLE, LOADOUT, 'other', none).filter((r) =>
      r.technique.superpowers.includes('connector'),
    )
    expect(withPack.length).toBeGreaterThan(0)
    expect(withPack[0]?.viaSlot).toBe('outer')
    expect(without).toHaveLength(0)
  })

  it('only published hero cells enter the default pool', () => {
    const pub = publishedDeck('connector')
    expect(pub.length).toBe(6) // the six authored Connector hero cells
    expect(pub.every((c) => c.status === 'published')).toBe(true)
    expect(poolWithSuperpowers(CANONICAL_TECHNIQUES, ['connector'])).toHaveLength(
      CANONICAL_TECHNIQUES.length + 6,
    )
  })
})

describe('citation works without owning content', () => {
  it('cites the coordinate + owned flag, never the content', () => {
    const cite = citeSuperpowerMove(SAMPLE, LOADOUT, 'other', [])
    expect(cite.superpower).toBe('connector')
    expect(cite.aspect).toBe('outer')
    expect(cite.owned).toBe(false)
    expect(cite.cardId).toBe('sp-connector-OPEN-DIPLOMAT-OUTER')
    expect(cite).not.toHaveProperty('steps')
  })
})
