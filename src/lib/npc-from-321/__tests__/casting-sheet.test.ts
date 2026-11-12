import { describe, expect, it } from 'vitest'
import { normalizeCastingSheet } from '../casting-sheet'

describe('normalizeCastingSheet', () => {
  it('keeps a known build and names its source', () => {
    const r = normalizeCastingSheet({ build: ' Heavy ', sources: { build: 'q1' } })
    expect(r.fields.build).toBe('heavy')
    expect(r.sources.build).toBe('q1')
  })
  it('defaults a filled field with no source to creator', () => {
    expect(normalizeCastingSheet({ build: 'slight' }).sources.build).toBe('creator')
  })
  it('leaves an unrecognised build blank instead of inventing one', () => {
    const r = normalizeCastingSheet({ build: 'giant', sources: { build: 'q1' } })
    expect(r.fields.build).toBeUndefined()
    expect(r.blank).toContain('build')
  })
  it('maps gender words to m or f', () => {
    expect(normalizeCastingSheet({ gender: 'Woman' }).fields.gender).toBe('f')
  })
  it('an empty sheet is all blank', () => {
    expect(normalizeCastingSheet(null).blank).toHaveLength(7)
  })
})
