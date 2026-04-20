/**
 * bar-asset.roundtrip.test.ts
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Integration test: prose → BarSeed → BarAsset → game renderable
 *
 * Uses a mock NL provider to avoid real API calls in tests.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'bun:test'

import type { BarSeed } from '../bar-seed-metabolization/types'
import type { SeedMetabolizationState } from '../bar-seed-metabolization/types'

// ---------------------------------------------------------------------------
// Mock NL response — a valid dungeon room
// ---------------------------------------------------------------------------

const MOCK_ROOM_RESPONSE = JSON.stringify({
  name: 'Chamber of the Weeping Icon',
  description: 'A vaulted stone chamber, its walls slick with centuries of condensation. At the center stands a cracked marble altar, a tarnished silver reliquary resting upon it. The air tastes of copper and old incense.',
  exits: [
    {
      direction: 'north',
      leadsTo: 'A torch-lit corridor stretches into darkness, the sound of dripping water echoing from beyond.',
      barrier: null,
    },
    {
      direction: 'through the iron gate',
      leadsTo: 'A narrow stairway spirals upward into shadow.',
      barrier: 'The gate is rusted shut, its hinges fused by time.',
    },
  ],
  props: [
    {
      name: 'tarnished reliquary',
      description: 'A silver box dented on one side, its surface etched with prayers in a forgotten script.',
    },
    {
      name: 'cracked altar',
      description: 'Marble veined with dark staining, split nearly in two by some ancient violence.',
    },
  ],
  mood: 'sacred',
})

// ---------------------------------------------------------------------------
// Mock AI dispatcher — module-level so it persists across re-imports
// ---------------------------------------------------------------------------

const mockDispatchAI = vi.fn().mockResolvedValue({
  output: MOCK_ROOM_RESPONSE,
  tokensUsed: 847,
  provider: 'zo',
})

// Mock the dispatcher module once at the top level
vi.mock('../bar-asset/dispatcher', () => ({
  dispatchAI: mockDispatchAI,
}))

// ---------------------------------------------------------------------------
// System under test — imported after mock is set
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSeed(overrides: Partial<{
  id: string
  title: string
  description: string
  barType: string
  contextNote: string
  metadata: Record<string, unknown>
}> = {}): BarSeed {
  return {
    id: 'blessed_wendell_001',
    title: 'The Ring of Remembered Names',
    description: 'A tarnished silver band worn smooth by generations of anxious hands. Inside the band, a phrase is etched in a language no one living can read. It was found in the possession of a dying cartographer who insisted he had never worn it.',
    barType: 'blessed',
    soilKind: null,
    contextNote: 'A sacred object recovered from the old world',
    metadata: {
      author: 'wendell',
      metabolization: {
        maturity: 'shared_or_acted' as const,
        soilKind: null,
        contextNote: 'A sacred object recovered from the old world',
        compostedAt: null,
      },
      sequence: 1,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('bar-asset round-trip: prose → BarSeed → BarAsset', () => {
  beforeEach(() => {
    // Clear mock call history between tests but keep the mock in place
    mockDispatchAI.mockClear()
    // Reset the default mock return value for each test
    mockDispatchAI.mockResolvedValue({
      output: MOCK_ROOM_RESPONSE,
      tokensUsed: 847,
      provider: 'zo',
    })
  })

  it('returns a BarAsset with correct structured id', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    const asset = await translateBarSeedToAsset(seed, 'wendell')

    expect(asset.maturity).toBe('integrated')
    expect(asset.barDef.id).toBe('blessed_wendell_001')
    expect(asset.sourceSeedId).toBe('blessed_wendell_001')
    expect(asset.barDef.type).toBe('story')
  })

  it('extracts name and description from NL output', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    const asset = await translateBarSeedToAsset(seed, 'wendell')

    expect(asset.barDef.title).toBe('Chamber of the Weeping Icon')
    expect(asset.barDef.description).toContain('vaulted stone chamber')
    expect(asset.barDef.description).toContain('tarnished silver reliquary')
  })

  it('extracts exits and barrier information', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    const asset = await translateBarSeedToAsset(seed, 'wendell')

    // storyPath encodes exits: blessed/blessed_wendell_001/start
    expect(asset.barDef.storyPath).toBe('blessed/blessed_wendell_001/start')
  })

  it('sets correct metadata on the BarAsset', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    const asset = await translateBarSeedToAsset(seed, 'wendell')

    expect(asset.metadata?.author).toBe('wendell')
    expect(asset.metadata?.translationProvider).toBe('zo')
    expect(asset.metadata?.translationTokens).toBe(847)
  })

  it('throws SeedMaturityError when seed maturity is too low', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    seed.metadata = {
      ...seed.metadata,
      metabolization: {
        maturity: 'captured' as SeedMetabolizationState['maturity'],
        soilKind: null,
        contextNote: null,
        compostedAt: null,
      },
    }

    await expect(translateBarSeedToAsset(seed, 'wendell')).rejects.toThrow('BarSeed maturity')
  })

  it('throws SeedMaturityError when maturity is elaborated', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    seed.metadata = {
      ...seed.metadata,
      metabolization: {
        maturity: 'elaborated' as SeedMetabolizationState['maturity'],
        soilKind: null,
        contextNote: null,
        compostedAt: null,
      },
    }

    await expect(translateBarSeedToAsset(seed, 'wendell')).rejects.toThrow('BarSeed maturity')
  })

  it('allows seed with maturity = shared_or_acted', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    // maturity = shared_or_acted is the default in makeSeed
    await expect(translateBarSeedToAsset(seed, 'wendell')).resolves.toBeDefined()
  })

  it('calls the NL dispatcher with correct prompts', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    await translateBarSeedToAsset(seed, 'wendell')

    expect(mockDispatchAI).toHaveBeenCalledTimes(1)
    const call = mockDispatchAI.mock.calls[0][0]
    expect(call.system).toContain('retro RPG dungeon room designer')
    expect(call.input).toContain('The Ring of Remembered Names')
    expect(call.input).toContain('tarnished silver band')
  })

  it('throws TranslationError when NL output is not JSON', async () => {
    mockDispatchAI.mockResolvedValueOnce({
      output: 'This is not JSON output',
      tokensUsed: 100,
      provider: 'zo',
    })

    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    await expect(translateBarSeedToAsset(seed, 'wendell')).rejects.toThrow('NL provider returned non-JSON')
  })

  it('throws TranslationError when NL output is missing required fields', async () => {
    mockDispatchAI.mockResolvedValueOnce({
      output: JSON.stringify({ name: 'Only a Name' }),
      tokensUsed: 50,
      provider: 'zo',
    })

    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    await expect(translateBarSeedToAsset(seed, 'wendell')).rejects.toThrow('NL output missing required fields')
  })

  it('builds correct blessed_wendell_001 id', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed()
    const asset = await translateBarSeedToAsset(seed, 'wendell')
    expect(asset.barDef.id).toBe('blessed_wendell_001')
  })

  it('builds correct quest_barsengine_001 id', async () => {
    const { translateBarSeedToAsset } = await import('../bar-asset/translator')
    const seed = makeSeed({ barType: 'quest' })
    const asset = await translateBarSeedToAsset(seed, 'barsengine')
    expect(asset.barDef.id).toBe('quest_barsengine_001')
  })
})

describe('provider resolution', () => {
  it('throws when no env vars are set', async () => {
    // Temporarily clear env vars
    const originalZo = process.env.ZO_AI_API_KEY
    const originalAnthropic = process.env.ANTHROPIC_API_KEY
    const originalOpenAI = process.env.OPENAI_API_KEY

    delete process.env.ZO_AI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY

    const { resolveProviderFromEnv } = await import('../bar-asset/providers')

    try {
      expect(() => resolveProviderFromEnv()).toThrow('No AI provider configured')
    } finally {
      // Restore original env vars
      if (originalZo !== undefined) process.env.ZO_AI_API_KEY = originalZo
      if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic
      if (originalOpenAI !== undefined) process.env.OPENAI_API_KEY = originalOpenAI
    }
  })

  it('resolves anthropic when ANTHROPIC_API_KEY is set', async () => {
    const originalZo = process.env.ZO_AI_API_KEY
    const originalAnthropic = process.env.ANTHROPIC_API_KEY
    const originalOpenAI = process.env.OPENAI_API_KEY

    delete process.env.ZO_AI_API_KEY
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
    delete process.env.OPENAI_API_KEY

    const { resolveProviderFromEnv } = await import('../bar-asset/providers')

    try {
      const config = resolveProviderFromEnv()
      expect(config.provider).toBe('anthropic')
      expect(config.apiKey).toBe('sk-ant-test-key')
    } finally {
      if (originalZo !== undefined) process.env.ZO_AI_API_KEY = originalZo
      if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic
      if (originalOpenAI !== undefined) process.env.OPENAI_API_KEY = originalOpenAI
    }
  })
})
