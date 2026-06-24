import { describe, it, expect } from 'vitest'

import { validateTechnique } from '../validate'
import { CANONICAL_TECHNIQUES } from '../canonical'
import type { Technique } from '../types'

function base(partial: Partial<Technique> = {}): Technique {
  return {
    id: 'id',
    slug: 'slug',
    name: 'Name',
    essence: 'does a thing',
    steps: ['step one'],
    source: { origin: 'gm' },
    moves: ['clean_up'],
    operations: [],
    domains: [],
    channels: [],
    aspect: 'both',
    superpowers: [],
    tier: 'community',
    status: 'published',
    ...partial,
  }
}

describe('validateTechnique — required fields', () => {
  it('passes a minimal valid technique', () => {
    expect(validateTechnique(base())).toEqual({ ok: true })
  })

  it('requires at least one move', () => {
    const r = validateTechnique(base({ moves: [] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.startsWith('moves'))).toBe(true)
  })

  it('requires steps', () => {
    const r = validateTechnique(base({ steps: [] }))
    expect(r.ok).toBe(false)
  })
})

describe('validateTechnique — enum membership', () => {
  it('rejects invalid tag values', () => {
    const r = validateTechnique(base({ moves: ['flying' as never], aspect: 'sideways' as never }))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.some((e) => e.startsWith('moves'))).toBe(true)
      expect(r.errors.some((e) => e.startsWith('aspect'))).toBe(true)
    }
  })
})

describe('validateTechnique — provenance gate', () => {
  it('rejects a tradition import missing lineage/permission/footing', () => {
    const r = validateTechnique(base({ source: { origin: 'tradition', name: 'IFS' } }))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.some((e) => e.startsWith('source.lineage'))).toBe(true)
      expect(r.errors.some((e) => e.startsWith('source.permission'))).toBe(true)
      expect(r.errors.some((e) => e.startsWith('ontologicalFooting'))).toBe(true)
    }
  })

  it('accepts a tradition import with full provenance', () => {
    const r = validateTechnique(
      base({
        source: {
          origin: 'tradition',
          name: 'Internal Family Systems',
          lineage: 'Richard Schwartz / IFS Institute',
          permission: 'Used with attribution; adapted for allyship practice',
        },
        ontologicalFooting: 'Serves development by relating to parts with curiosity rather than suppression.',
      }),
    )
    expect(r).toEqual({ ok: true })
  })

  it('requires a name for book-sourced techniques', () => {
    const r = validateTechnique(base({ source: { origin: 'book' } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.some((e) => e.startsWith('source.name'))).toBe(true)
  })

  it('lets personal/player techniques through with minimal provenance', () => {
    const r = validateTechnique(base({ tier: 'personal', source: { origin: 'player' } }))
    expect(r).toEqual({ ok: true })
  })
})

describe('canonical seed is all valid', () => {
  it.each(CANONICAL_TECHNIQUES.map((t) => [t.name, t] as const))('%s validates', (_name, t) => {
    expect(validateTechnique(t)).toEqual({ ok: true })
  })
})
