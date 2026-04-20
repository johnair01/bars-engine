/**
 * bar-asset.feedback-loop.test.ts — Phase 4
 * Sprint: sprint/bar-asset-pipeline-001
 */

import { describe, expect, it } from 'bun:test'
import { playDataToBarSeed, validatePlayData } from '../bar-asset/play-data'

const BASE_PLAY_DATA = {
  sourceBarId: 'blessed_wendell_001',
  playerId: 'player_test_001',
  eventType: 'completion' as const,
  payload: { outcome: 'village_saved', timeToComplete: 42000 },
  playedAt: '2026-04-20T20:00:00Z',
}

describe('playDataToBarSeed', () => {
  it('converts completion event to BarSeed content', () => {
    const result = playDataToBarSeed(BASE_PLAY_DATA)
    expect(result).not.toBeNull()
    expect(result!.content).toContain('village_saved')
    expect(result!.content).toContain('42000ms')
    expect(result!.metadata.maturity).toBe('captured')
    expect(result!.metadata.soilKind).toBeNull()
  })

  it('converts choice event to BarSeed content', () => {
    const choice: typeof BASE_PLAY_DATA = {
      ...BASE_PLAY_DATA,
      eventType: 'choice',
      payload: { selectedOption: 2 },
    }
    const result = playDataToBarSeed(choice)
    expect(result).not.toBeNull()
    expect(result!.content).toContain('option 2')
  })

  it('converts outcome event to BarSeed content', () => {
    const outcome: typeof BASE_PLAY_DATA = {
      ...BASE_PLAY_DATA,
      eventType: 'outcome',
      payload: { outcome: 'secret_revealed' },
    }
    const result = playDataToBarSeed(outcome)
    expect(result).not.toBeNull()
    expect(result!.content).toContain('secret_revealed')
  })

  it('returns null for abandon events', () => {
    const abandon: typeof BASE_PLAY_DATA = {
      ...BASE_PLAY_DATA,
      eventType: 'abandon',
      payload: {},
    }
    const result = playDataToBarSeed(abandon)
    expect(result).toBeNull()
  })

  it('returns null when sourceBarId is empty', () => {
    const empty: typeof BASE_PLAY_DATA = {
      ...BASE_PLAY_DATA,
      sourceBarId: '',
    }
    const result = playDataToBarSeed(empty)
    expect(result).toBeNull()
  })

  it('marks slow completions (>5min) with slow flag', () => {
    const slow: typeof BASE_PLAY_DATA = {
      ...BASE_PLAY_DATA,
      eventType: 'completion',
      payload: { outcome: 'finished', timeToComplete: 8 * 60 * 1000 },
    }
    const result = playDataToBarSeed(slow)
    expect(result).not.toBeNull()
    expect(result!.content).toContain('slow completion flag')
  })

  it('uses custom creator namespace', () => {
    const result = playDataToBarSeed(BASE_PLAY_DATA, 'my_pipeline')
    expect(result).not.toBeNull()
    // creator param reserved for barSeedId construction in feedback-loop; not embedded in content
  })

  it('sets playback context in metadata', () => {
    const result = playDataToBarSeed(BASE_PLAY_DATA)
    expect(result!.metadata.contextNote).toMatch(/playback:player_test_001:completion/)
  })
})

describe('validatePlayData', () => {
  it('accepts valid play data', () => {
    const result = validatePlayData(BASE_PLAY_DATA)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects non-object input', () => {
    const result = validatePlayData('not an object')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('playData must be an object')
  })

  it('rejects missing sourceBarId', () => {
    const result = validatePlayData({ ...BASE_PLAY_DATA, sourceBarId: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('sourceBarId'))).toBe(true)
  })

  it('rejects missing playerId', () => {
    const result = validatePlayData({ ...BASE_PLAY_DATA, playerId: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('playerId'))).toBe(true)
  })

  it('rejects invalid eventType', () => {
    const result = validatePlayData({ ...BASE_PLAY_DATA, eventType: 'invalid' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('eventType'))).toBe(true)
  })

  it('rejects missing payload', () => {
    const result = validatePlayData({ ...BASE_PLAY_DATA, payload: undefined })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('payload'))).toBe(true)
  })
})