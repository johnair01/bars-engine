/**
 * bar-asset.protocol.test.ts
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Integration test for the BAR Asset Pipeline protocol.
 * Verifies maturity-gated acceptance between Constructor A and Constructor B.
 */

import { describe, expect, it } from 'bun:test'
import { MATURITY_PHASES } from '../bar-asset/types'
import { hasMinimumMaturityForConstructorB, promoteToIntegrated } from '../bar-asset/types'
import { buildStructuredBarId, parseStructuredBarId, normalizeBarId } from '../bar-asset/id'
import type { BarDef } from '../bars'
import type { SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBarDef(overrides: Partial<BarDef> = {}): BarDef {
  return {
    id: 'blessed_wendell_001',
    type: 'vibe' as const,
    title: 'Test Blessing',
    description: 'A test blessing artifact',
    inputs: [],
    reward: 0,
    unique: true,
    ...overrides,
  }
}

function makeMetabolization(overrides: Partial<SeedMetabolizationState> = {}): SeedMetabolizationState {
  return {
    soilKind: 'campaign',
    contextNote: null,
    maturity: 'shared_or_acted',
    compostedAt: null,
    releaseNote: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Maturity Gate Tests
// ---------------------------------------------------------------------------

describe('maturity gate: Constructor B acceptance', () => {
  it('accepts maturity = integrated', () => {
    const state = makeMetabolization({ maturity: 'integrated' })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(true)
  })

  it('accepts maturity = shared_or_acted', () => {
    const state = makeMetabolization({ maturity: 'shared_or_acted' })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(true)
  })

  it('rejects maturity = elaborated', () => {
    const state = makeMetabolization({ maturity: 'elaborated' })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(false)
  })

  it('rejects maturity = context_named', () => {
    const state = makeMetabolization({ maturity: 'context_named' })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(false)
  })

  it('rejects maturity = captured', () => {
    const state = makeMetabolization({ maturity: 'captured' })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(false)
  })

  it('rejects null maturity (defaults to captured)', () => {
    const state = makeMetabolization({ maturity: null })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(false)
  })

  it('rejects undefined maturity (defaults to captured)', () => {
    const state = makeMetabolization({ maturity: undefined })
    expect(hasMinimumMaturityForConstructorB(state)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Constructor B: promoteToIntegrated
// ---------------------------------------------------------------------------

describe('promoteToIntegrated: Constructor B output', () => {
  it('produces BarAsset with maturity = integrated', () => {
    const barDef = makeBarDef({ id: 'blessed_wendell_001' })
    const asset = promoteToIntegrated(barDef, 'blessed_wendell_001')

    expect(asset.maturity).toBe('integrated')
    expect(asset.sourceSeedId).toBe('blessed_wendell_001')
    expect(asset.integratedAt).toBeTruthy()
    expect(asset.barDef.id).toBe('blessed_wendell_001')
  })

  it('preserves barDef through promotion', () => {
    const barDef = makeBarDef({ type: 'story', title: 'My Story', unique: false })
    const asset = promoteToIntegrated(barDef, 'story_wendell_042')

    expect(asset.barDef.type).toBe('story')
    expect(asset.barDef.title).toBe('My Story')
    expect(asset.barDef.unique).toBe(false)
  })

  it('attaches metadata when provided', () => {
    const barDef = makeBarDef()
    const metadata = {
      author: 'wendell',
      tags: ['allyship', 'chapter1'],
      gameMasterFace: 'shaman',
    }
    const asset = promoteToIntegrated(barDef, 'blessed_wendell_001', metadata)

    expect(asset.metadata?.author).toBe('wendell')
    expect(asset.metadata?.tags).toEqual(['allyship', 'chapter1'])
    expect(asset.metadata?.gameMasterFace).toBe('shaman')
  })

  it('sets integratedAt to ISO 8601 timestamp', () => {
    const barDef = makeBarDef()
    const asset = promoteToIntegrated(barDef, 'blessed_wendell_001')

    expect(asset.integratedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

// ---------------------------------------------------------------------------
// Structured Bar ID Tests
// ---------------------------------------------------------------------------

describe('buildStructuredBarId', () => {
  it('builds correct format: blessed_wendell_001', () => {
    const id = buildStructuredBarId('blessed', 'wendell', 1)
    expect(id).toBe('blessed_wendell_001')
  })

  it('pads sequence to 3 digits', () => {
    expect(buildStructuredBarId('rune', 'zoc', 7)).toBe('rune_zoc_007')
    expect(buildStructuredBarId('quest', 'barsengine', 42)).toBe('quest_barsengine_042')
  })

  it('handles large sequence numbers', () => {
    expect(buildStructuredBarId('vibe', 'wendell', 1234)).toBe('vibe_wendell_1234')
  })

  it('sanitizes creator segment (lowercase, no spaces)', () => {
    expect(buildStructuredBarId('allyship', 'MasteringAllyship', 1)).toBe('allyship_masteringallyship_001')
    expect(buildStructuredBarId('blessed', 'ZoComputer', 1)).toBe('blessed_zocomputer_001')
    expect(buildStructuredBarId('story', 'john_air', 3)).toBe('story_john_air_003')
  })
})

describe('parseStructuredBarId', () => {
  it('parses valid structured ids', () => {
    const result = parseStructuredBarId('blessed_wendell_001')
    expect(result).toEqual({ barType: 'blessed', creator: 'wendell', sequence: 1 })
  })

  it('rejects wrong number of segments', () => {
    expect(parseStructuredBarId('blessed_wendell')).toBeNull()
    expect(parseStructuredBarId('blessed_wendell_001_extra')).toBeNull()
  })

  it('rejects invalid bar type', () => {
    expect(parseStructuredBarId('fake_wendell_001')).toBeNull()
  })

  it('rejects invalid creator (uppercase, spaces)', () => {
    expect(parseStructuredBarId('blessed_Wendell_001')).toBeNull()
    expect(parseStructuredBarId('blessed_wen dell_001')).toBeNull()
  })

  it('rejects invalid sequence (not 3-6 digits)', () => {
    expect(parseStructuredBarId('blessed_wendell_1')).toBeNull()
    expect(parseStructuredBarId('blessed_wendell_1234567')).toBeNull()
  })
})

describe('normalizeBarId', () => {
  it('returns structured ids as-is with isLegacy=false', () => {
    const result = normalizeBarId('blessed_wendell_001')
    expect(result?.normalized).toBe('blessed_wendell_001')
    expect(result?.isLegacy).toBe(false)
  })

  it('passes through legacy ids with isLegacy=true', () => {
    const result = normalizeBarId('some-old-bar-id-123')
    expect(result?.normalized).toBe('some-old-bar-id-123')
    expect(result?.isLegacy).toBe(true)
  })

  it('returns null for empty string', () => {
    expect(normalizeBarId('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// MATURITY_PHASES constant (export check)
// ---------------------------------------------------------------------------

describe('MATURITY_PHASES export', () => {
  it('contains all 5 maturity phases in correct order', () => {
    expect(MATURITY_PHASES).toEqual([
      'captured',
      'context_named',
      'elaborated',
      'shared_or_acted',
      'integrated',
    ])
  })
})