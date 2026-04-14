/**
 * Sub-AC 3: Reflection BAR Persistence Wiring Tests
 *
 * Validates that selected or edited Reflection BAR completion content
 * flows through the full persistence chain and is saved as the epiphany artifact
 * with correct provenance metadata.
 *
 * Tests the wiring: ReflectionPhaseState → completeReflectionPhase → buildReflectionBarData → BAR
 *
 * Covers:
 *   1. CYOA-selected completion → BAR content + isEpiphany: true
 *   2. CYOA-edited (customized) completion → BAR content preserves edits + isCustomized
 *   3. Freeform-authored reflection → BAR content is the player's own text
 *   4. reflectionSource provenance flows into strandMetadata
 *   5. Provenance is optional — BAR is valid without it
 *   6. All 3 paths produce valid Reflection BARs (type='reflection', isEpiphany=true)
 *   7. Channel typing is consistent regardless of content creation mode
 *   8. Provenance does not affect BAR content — only strandMetadata
 *
 * Run: npx vitest run src/lib/alchemy-engine/__tests__/reflection-bar-persistence-wiring.test.ts
 */

import { describe, test, expect } from 'vitest'
import {
  buildReflectionBarData,
  type ReflectionBarContext,
  type ReflectionBarMetadata,
  type BarCreateData,
} from '../bar-production'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Test data — simulates what AlchemyArcRunner passes through
// ---------------------------------------------------------------------------

const PLAYER_ID = 'test-player-wiring'
const TEST_CHANNEL: EmotionalChannel = 'Anger'
const INTAKE_BAR_ID = 'intake-bar-abc'
const ACTION_BAR_ID = 'action-bar-def'

// Simulated CYOA completion (from ReflectionPhaseStep DEFAULT_CHALLENGER_REFLECTIONS)
const CYOA_ORIGINAL_CONTENT = 'What I thought was resistance was actually a boundary asking to be honored. The challenge wasn\'t to push through — it was to recognize what I was protecting and why it matters. The anger was a compass, not a cage.'
const CYOA_TITLE = 'The boundary was the breakthrough'
const CYOA_COMPLETION_ID = 'boundary_honored'

// Simulated edited version
const EDITED_CONTENT = 'What I thought was resistance was actually a boundary asking to be honored. The anger was my compass — and now I see where it was pointing.'

// Simulated freeform content
const FREEFORM_CONTENT = 'I finally understand that my anger was trying to protect something valuable. The boundary wasn\'t weakness — it was wisdom I hadn\'t named yet.'
const FREEFORM_TITLE = 'My Personal Wake Up'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMetadata(barData: BarCreateData): ReflectionBarMetadata {
  return JSON.parse(barData.strandMetadata)
}

function buildBaseContext(): Omit<ReflectionBarContext, 'content' | 'title' | 'reflectionSource'> {
  return {
    playerId: PLAYER_ID,
    channel: TEST_CHANNEL,
    waveMove: 'wakeUp',
    face: 'challenger',
    intakeBarId: INTAKE_BAR_ID,
    actionBarId: ACTION_BAR_ID,
  }
}

// ---------------------------------------------------------------------------
// 1. CYOA-selected completion → BAR content + isEpiphany: true
// ---------------------------------------------------------------------------

describe('CYOA-selected completion → Reflection BAR persistence', () => {
  test('selected CYOA content becomes BAR description (= epiphany artifact)', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: CYOA_ORIGINAL_CONTENT,
      title: CYOA_TITLE,
      reflectionSource: {
        mode: 'cyoa',
        selectedCompletionId: CYOA_COMPLETION_ID,
        isCustomized: false,
      },
    })

    // The BAR description IS the CYOA completion content
    expect(barData.description).toBe(CYOA_ORIGINAL_CONTENT)
    expect(barData.title).toBe(CYOA_TITLE)

    // Core epiphany invariant
    const meta = parseMetadata(barData)
    expect(meta.isEpiphany).toBe(true)
    expect(meta.arcPhase).toBe('reflection')
    expect(meta.alchemyEngine).toBe(true)
  })

  test('provenance records CYOA mode and selectedCompletionId', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: CYOA_ORIGINAL_CONTENT,
      title: CYOA_TITLE,
      reflectionSource: {
        mode: 'cyoa',
        selectedCompletionId: CYOA_COMPLETION_ID,
        isCustomized: false,
      },
    })

    const meta = parseMetadata(barData)
    expect(meta.reflectionSource).toBeDefined()
    expect(meta.reflectionSource!.mode).toBe('cyoa')
    expect(meta.reflectionSource!.selectedCompletionId).toBe(CYOA_COMPLETION_ID)
    expect(meta.reflectionSource!.isCustomized).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. CYOA-edited (customized) completion → BAR preserves edits
// ---------------------------------------------------------------------------

describe('CYOA-edited completion → Reflection BAR persistence', () => {
  test('edited content becomes BAR description, not original', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: EDITED_CONTENT,
      title: CYOA_TITLE,
      reflectionSource: {
        mode: 'cyoa',
        selectedCompletionId: CYOA_COMPLETION_ID,
        isCustomized: true,
      },
    })

    // The BAR description is the EDITED content
    expect(barData.description).toBe(EDITED_CONTENT)
    expect(barData.description).not.toBe(CYOA_ORIGINAL_CONTENT)

    // Provenance records the customization
    const meta = parseMetadata(barData)
    expect(meta.reflectionSource!.isCustomized).toBe(true)
    expect(meta.reflectionSource!.selectedCompletionId).toBe(CYOA_COMPLETION_ID)
  })

  test('isEpiphany remains true for customized content', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: EDITED_CONTENT,
      title: CYOA_TITLE,
      reflectionSource: {
        mode: 'cyoa',
        selectedCompletionId: CYOA_COMPLETION_ID,
        isCustomized: true,
      },
    })

    const meta = parseMetadata(barData)
    expect(meta.isEpiphany).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Freeform-authored reflection → BAR content is player's text
// ---------------------------------------------------------------------------

describe('Freeform reflection → Reflection BAR persistence', () => {
  test('freeform content becomes BAR description', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: FREEFORM_CONTENT,
      title: FREEFORM_TITLE,
      reflectionSource: {
        mode: 'freeform',
      },
    })

    expect(barData.description).toBe(FREEFORM_CONTENT)
    expect(barData.title).toBe(FREEFORM_TITLE)
  })

  test('freeform provenance records mode without completionId', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: FREEFORM_CONTENT,
      title: FREEFORM_TITLE,
      reflectionSource: {
        mode: 'freeform',
      },
    })

    const meta = parseMetadata(barData)
    expect(meta.reflectionSource!.mode).toBe('freeform')
    expect(meta.reflectionSource!.selectedCompletionId).toBeUndefined()
    expect(meta.reflectionSource!.isCustomized).toBeUndefined()
  })

  test('freeform BAR is still isEpiphany: true', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: FREEFORM_CONTENT,
      title: FREEFORM_TITLE,
      reflectionSource: {
        mode: 'freeform',
      },
    })

    const meta = parseMetadata(barData)
    expect(meta.isEpiphany).toBe(true)
    expect(meta.arcPhase).toBe('reflection')
  })
})

// ---------------------------------------------------------------------------
// 4. reflectionSource provenance flows into strandMetadata
// ---------------------------------------------------------------------------

describe('reflectionSource flows through to strandMetadata', () => {
  test('all reflectionSource fields are preserved in metadata', () => {
    const source = {
      mode: 'cyoa' as const,
      selectedCompletionId: 'wake_up_moment',
      isCustomized: true,
    }

    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: 'Test content for provenance verification.',
      reflectionSource: source,
    })

    const meta = parseMetadata(barData)
    expect(meta.reflectionSource).toEqual(source)
  })
})

// ---------------------------------------------------------------------------
// 5. Provenance is optional — BAR is valid without it
// ---------------------------------------------------------------------------

describe('Provenance is optional', () => {
  test('BAR without reflectionSource is still valid', () => {
    const barData = buildReflectionBarData({
      ...buildBaseContext(),
      content: 'Reflection without provenance metadata.',
    })

    const meta = parseMetadata(barData)
    expect(meta.isEpiphany).toBe(true)
    expect(meta.arcPhase).toBe('reflection')
    expect(meta.alchemyEngine).toBe(true)
    // reflectionSource should be absent (not null, not undefined — just not set)
    expect(meta.reflectionSource).toBeUndefined()
  })

  test('BAR content is identical with and without provenance', () => {
    const content = 'Same content regardless of provenance.'
    const title = 'Same Title'

    const withProvenance = buildReflectionBarData({
      ...buildBaseContext(),
      content,
      title,
      reflectionSource: { mode: 'cyoa', selectedCompletionId: 'test', isCustomized: false },
    })

    const withoutProvenance = buildReflectionBarData({
      ...buildBaseContext(),
      content,
      title,
    })

    // Content fields are identical
    expect(withProvenance.description).toBe(withoutProvenance.description)
    expect(withProvenance.title).toBe(withoutProvenance.title)
    expect(withProvenance.type).toBe(withoutProvenance.type)
    expect(withProvenance.nation).toBe(withoutProvenance.nation)
    expect(withProvenance.moveType).toBe(withoutProvenance.moveType)
    expect(withProvenance.gameMasterFace).toBe(withoutProvenance.gameMasterFace)
  })
})

// ---------------------------------------------------------------------------
// 6. All 3 paths produce valid Reflection BARs
// ---------------------------------------------------------------------------

describe('All content creation modes produce valid Reflection BARs', () => {
  const modes: Array<{
    label: string
    content: string
    title: string
    source?: ReflectionBarContext['reflectionSource']
  }> = [
    {
      label: 'CYOA selected',
      content: CYOA_ORIGINAL_CONTENT,
      title: CYOA_TITLE,
      source: { mode: 'cyoa', selectedCompletionId: CYOA_COMPLETION_ID, isCustomized: false },
    },
    {
      label: 'CYOA edited',
      content: EDITED_CONTENT,
      title: CYOA_TITLE,
      source: { mode: 'cyoa', selectedCompletionId: CYOA_COMPLETION_ID, isCustomized: true },
    },
    {
      label: 'freeform',
      content: FREEFORM_CONTENT,
      title: FREEFORM_TITLE,
      source: { mode: 'freeform' },
    },
  ]

  for (const { label, content, title, source } of modes) {
    test(`${label} mode produces valid BAR with type=reflection, isEpiphany=true`, () => {
      const barData = buildReflectionBarData({
        ...buildBaseContext(),
        content,
        title,
        reflectionSource: source,
      })

      // Common BAR structure
      expect(barData.type).toBe('reflection')
      expect(barData.status).toBe('seed')
      expect(barData.moveType).toBe('wakeUp')
      expect(barData.gameMasterFace).toBe('challenger')
      expect(barData.creatorId).toBe(PLAYER_ID)

      // Epiphany invariant
      const meta = parseMetadata(barData)
      expect(meta.isEpiphany).toBe(true)
      expect(meta.arcPhase).toBe('reflection')
      expect(meta.alchemyEngine).toBe(true)

      // Provenance chain
      expect(meta.intakeBarId).toBe(INTAKE_BAR_ID)
      expect(meta.actionBarId).toBe(ACTION_BAR_ID)
    })
  }
})

// ---------------------------------------------------------------------------
// 7. Channel typing is consistent regardless of content creation mode
// ---------------------------------------------------------------------------

describe('Channel typing is mode-independent', () => {
  const channels: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']
  const channelToDb: Record<string, string> = {
    Fear: 'fear', Anger: 'anger', Sadness: 'sadness', Joy: 'joy', Neutrality: 'neutrality',
  }

  for (const ch of channels) {
    test(`${ch} channel: CYOA and freeform produce same channel typing`, () => {
      const cyoaBar = buildReflectionBarData({
        playerId: PLAYER_ID,
        channel: ch,
        content: 'CYOA content',
        reflectionSource: { mode: 'cyoa', selectedCompletionId: 'test' },
      })

      const freeformBar = buildReflectionBarData({
        playerId: PLAYER_ID,
        channel: ch,
        content: 'Freeform content',
        reflectionSource: { mode: 'freeform' },
      })

      // Both have same channel typing
      expect(cyoaBar.nation).toBe(channelToDb[ch])
      expect(freeformBar.nation).toBe(channelToDb[ch])
      expect(cyoaBar.emotionalAlchemyTag).toBe(freeformBar.emotionalAlchemyTag)

      // Both metadata carry the same channel
      const cyoaMeta = parseMetadata(cyoaBar)
      const freeformMeta = parseMetadata(freeformBar)
      expect(cyoaMeta.channel).toBe(ch)
      expect(freeformMeta.channel).toBe(ch)
    })
  }
})

// ---------------------------------------------------------------------------
// 8. Provenance does not affect BAR content — only strandMetadata
// ---------------------------------------------------------------------------

describe('Provenance is metadata-only, does not affect BAR fields', () => {
  test('different provenance sources produce identical BAR fields (except strandMetadata)', () => {
    const content = 'Identical content across all modes.'
    const title = 'Same Title'
    const base = { ...buildBaseContext(), content, title }

    const cyoa = buildReflectionBarData({
      ...base,
      reflectionSource: { mode: 'cyoa', selectedCompletionId: 'x', isCustomized: false },
    })

    const edited = buildReflectionBarData({
      ...base,
      reflectionSource: { mode: 'cyoa', selectedCompletionId: 'x', isCustomized: true },
    })

    const freeform = buildReflectionBarData({
      ...base,
      reflectionSource: { mode: 'freeform' },
    })

    const none = buildReflectionBarData({ ...base })

    // All non-metadata fields are identical
    for (const bar of [cyoa, edited, freeform, none]) {
      expect(bar.description).toBe(content)
      expect(bar.title).toBe(title)
      expect(bar.type).toBe('reflection')
      expect(bar.nation).toBe('anger')
      expect(bar.emotionalAlchemyTag).toBe('anger')
      expect(bar.moveType).toBe('wakeUp')
      expect(bar.gameMasterFace).toBe('challenger')
      expect(bar.status).toBe('seed')
      expect(bar.creatorId).toBe(PLAYER_ID)
    }

    // Only strandMetadata differs (due to reflectionSource)
    expect(cyoa.strandMetadata).not.toBe(none.strandMetadata)
    expect(freeform.strandMetadata).not.toBe(cyoa.strandMetadata)
  })
})
