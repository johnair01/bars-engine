/**
 * Alchemy Engine — Passage Resolver Tests
 *
 * Tests the graceful AI fallback mechanism:
 *   - AI unavailability detection (proactive, not reactive)
 *   - Template bank fallback serves GM-authored content
 *   - Static inline fallback as ultimate safety net
 *   - Source attribution is always correct
 *   - Non-AI path is first-class (not degraded)
 *   - All phase × channel combinations produce valid content
 *   - Reflection completions fallback works
 *   - Environment-based feature flags (kill switch, disable)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  resolvePassage,
  resolveReflectionCompletions,
  resolveTemplatePassage,
  resolveSlot,
  getPhaseTemplate,
  getReflectionTemplate,
  checkAIAvailability,
  type ResolvedPassage,
  type ContentSource,
  type FallbackReason,
} from '../passage-resolver'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import type { ArcPhase } from '../types'
import { ARC_PHASES } from '../types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const ALL_CHANNELS: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']

/** Assert resolved passage has valid structure. */
function assertValidPassage(passage: ResolvedPassage) {
  expect(passage.situation).toBeTruthy()
  expect(passage.situation.length).toBeGreaterThan(10)
  expect(passage.friction).toBeTruthy()
  expect(passage.friction.length).toBeGreaterThan(10)
  expect(passage.invitation).toBeTruthy()
  expect(passage.invitation.length).toBeGreaterThan(10)
  expect(passage.metadata.resolvedAt).toBeTruthy()
  expect(passage.metadata.face).toBe('challenger')
  expect(passage.metadata.waveMove).toBe('wakeUp')
}

// ---------------------------------------------------------------------------
// checkAIAvailability
// ---------------------------------------------------------------------------

describe('checkAIAvailability', () => {
  const originalApiKey = process.env.OPENAI_API_KEY
  const originalAiEnabled = process.env.ALCHEMY_AI_ENABLED
  const originalKillSwitch = process.env.ALCHEMY_AI_KILL_SWITCH

  afterEach(() => {
    // Restore environment
    if (originalApiKey !== undefined) {
      process.env.OPENAI_API_KEY = originalApiKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
    if (originalAiEnabled !== undefined) {
      process.env.ALCHEMY_AI_ENABLED = originalAiEnabled
    } else {
      delete process.env.ALCHEMY_AI_ENABLED
    }
    if (originalKillSwitch !== undefined) {
      process.env.ALCHEMY_AI_KILL_SWITCH = originalKillSwitch
    } else {
      delete process.env.ALCHEMY_AI_KILL_SWITCH
    }
  })

  it('returns unavailable when OPENAI_API_KEY is missing', () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.ALCHEMY_AI_ENABLED
    delete process.env.ALCHEMY_AI_KILL_SWITCH

    const status = checkAIAvailability()
    expect(status.available).toBe(false)
    expect(status.hasApiKey).toBe(false)
    expect(status.reason).toContain('OPENAI_API_KEY')
  })

  it('returns unavailable when ALCHEMY_AI_ENABLED=false', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.ALCHEMY_AI_ENABLED = 'false'
    delete process.env.ALCHEMY_AI_KILL_SWITCH

    const status = checkAIAvailability()
    expect(status.available).toBe(false)
    expect(status.featureDisabled).toBe(true)
    expect(status.reason).toContain('ALCHEMY_AI_ENABLED')
  })

  it('returns unavailable when kill switch is active', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    delete process.env.ALCHEMY_AI_ENABLED
    process.env.ALCHEMY_AI_KILL_SWITCH = 'true'

    const status = checkAIAvailability()
    expect(status.available).toBe(false)
    expect(status.featureDisabled).toBe(true)
    expect(status.reason).toContain('kill switch')
  })

  it('returns available when API key is set and AI is enabled', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    delete process.env.ALCHEMY_AI_ENABLED
    delete process.env.ALCHEMY_AI_KILL_SWITCH

    const status = checkAIAvailability()
    expect(status.available).toBe(true)
    expect(status.hasApiKey).toBe(true)
    expect(status.reason).toBeUndefined()
  })

  it('includes checkedAt timestamp', () => {
    const status = checkAIAvailability()
    expect(status.checkedAt).toBeTruthy()
    // Should be a valid ISO date string
    expect(() => new Date(status.checkedAt)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// resolvePassage — preferStatic path (non-AI first-class)
// ---------------------------------------------------------------------------

describe('resolvePassage — preferStatic (non-AI first-class)', () => {
  it('returns valid content for every phase × channel combination', async () => {
    for (const phase of ARC_PHASES) {
      for (const channel of ALL_CHANNELS) {
        const passage = await resolvePassage(phase, channel, { preferStatic: true })
        assertValidPassage(passage)
        expect(passage.metadata.phase).toBe(phase)
        expect(passage.metadata.channel).toBe(channel)
      }
    }
  })

  it('uses template_bank as source', async () => {
    const passage = await resolvePassage('intake', 'Fear', { preferStatic: true })
    expect(passage.source).toBe('template_bank')
    expect(passage.fallbackReason).toBe('preferred_static')
    expect(passage.model).toBeNull()
  })

  it('produces channel-specific content (not just default)', async () => {
    const fearPassage = await resolvePassage('intake', 'Fear', { preferStatic: true })
    const angerPassage = await resolvePassage('intake', 'Anger', { preferStatic: true })

    // Channel-typed content should differ
    expect(fearPassage.situation).not.toBe(angerPassage.situation)
  })

  it('never throws regardless of AI availability', async () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    for (const phase of ARC_PHASES) {
      const passage = await resolvePassage(phase, 'Neutrality', { preferStatic: true })
      assertValidPassage(passage)
    }

    // Restore
    if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey
  })
})

// ---------------------------------------------------------------------------
// resolvePassage — AI unavailable path
// ---------------------------------------------------------------------------

describe('resolvePassage — AI unavailable', () => {
  const originalKey = process.env.OPENAI_API_KEY

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.OPENAI_API_KEY = originalKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  it('detects AI unavailability and serves template bank content', async () => {
    const passage = await resolvePassage('intake', 'Fear')

    assertValidPassage(passage)
    expect(passage.source).toBe('template_bank')
    expect(passage.fallbackReason).toBe('ai_unavailable')
    expect(passage.aiAvailable).toBe(false)
    expect(passage.model).toBeNull()
  })

  it('reports ai_disabled when feature flag is off', async () => {
    process.env.OPENAI_API_KEY = 'sk-test' // Key present but feature disabled
    process.env.ALCHEMY_AI_ENABLED = 'false'

    const passage = await resolvePassage('action', 'Anger')
    expect(passage.fallbackReason).toBe('ai_disabled')
    expect(passage.source).toBe('template_bank')

    delete process.env.ALCHEMY_AI_ENABLED
  })

  it('serves valid content for all 3 phases when AI is unavailable', async () => {
    for (const phase of ARC_PHASES) {
      const passage = await resolvePassage(phase, 'Joy')
      assertValidPassage(passage)
      expect(passage.source).toBe('template_bank')
    }
  })
})

// ---------------------------------------------------------------------------
// resolvePassage — with prior content
// ---------------------------------------------------------------------------

describe('resolvePassage — with prior content', () => {
  it('passes prior content through to static resolution', async () => {
    const passage = await resolvePassage('action', 'Anger', {
      preferStatic: true,
      priorContent: {
        intakeText: 'My boundary was crossed at work',
      },
    })

    assertValidPassage(passage)
    expect(passage.metadata.phase).toBe('action')
  })

  it('passes prior content through for reflection phase', async () => {
    const passage = await resolvePassage('reflection', 'Sadness', {
      preferStatic: true,
      priorContent: {
        intakeText: 'I miss the community I used to have',
        actionMoveTitle: 'Issue Challenge',
        actionText: 'I will reach out to three people',
      },
    })

    assertValidPassage(passage)
    expect(passage.metadata.phase).toBe('reflection')
  })
})

// ---------------------------------------------------------------------------
// resolveTemplatePassage — synchronous template bank access
// ---------------------------------------------------------------------------

describe('resolveTemplatePassage', () => {
  it('returns template bank content for all phases', () => {
    for (const phase of ARC_PHASES) {
      const passage = resolveTemplatePassage(phase, 'Fear')
      expect(passage).not.toBeNull()
      expect(passage!.source).toBe('template_bank')
      expect(passage!.situation.length).toBeGreaterThan(10)
    }
  })

  it('returns channel-specific content', () => {
    const fear = resolveTemplatePassage('intake', 'Fear')
    const joy = resolveTemplatePassage('intake', 'Joy')

    expect(fear).not.toBeNull()
    expect(joy).not.toBeNull()
    expect(fear!.situation).not.toBe(joy!.situation)
  })

  it('returns null for invalid phase (graceful)', () => {
    // This tests the error handling in resolveFromTemplateBank
    // getVerticalSliceTemplate throws for invalid phases
    // but resolveFromTemplateBank catches errors and returns null
    const passage = resolveTemplatePassage('nonexistent' as ArcPhase, 'Fear')
    expect(passage).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// resolveSlot — channel content resolution
// ---------------------------------------------------------------------------

describe('resolveSlot', () => {
  it('returns channel-specific content when override exists', () => {
    const slot = {
      default: 'Default text',
      channelOverrides: {
        Fear: 'Fear-specific text',
        Anger: 'Anger-specific text',
      },
    }

    expect(resolveSlot(slot, 'Fear')).toBe('Fear-specific text')
    expect(resolveSlot(slot, 'Anger')).toBe('Anger-specific text')
  })

  it('returns default when no channel override exists', () => {
    const slot = {
      default: 'Default text',
      channelOverrides: {
        Fear: 'Fear-specific text',
      },
    }

    expect(resolveSlot(slot, 'Joy')).toBe('Default text')
  })

  it('returns default when channel is null', () => {
    const slot = {
      default: 'Default text',
      channelOverrides: {
        Fear: 'Fear-specific text',
      },
    }

    expect(resolveSlot(slot, null)).toBe('Default text')
  })
})

// ---------------------------------------------------------------------------
// getPhaseTemplate — template accessor
// ---------------------------------------------------------------------------

describe('getPhaseTemplate', () => {
  it('returns templates for all 3 phases', () => {
    for (const phase of ARC_PHASES) {
      const template = getPhaseTemplate(phase)
      expect(template).toBeTruthy()
      expect(template.phase).toBe(phase)
      expect(template.face).toBe('challenger')
      expect(template.waveMove).toBe('wakeUp')
      expect(template.choices.length).toBeGreaterThan(0)
    }
  })

  it('intake template has expected regulation map', () => {
    const template = getPhaseTemplate('intake')
    expect(template.regulationFrom).toBe('dissatisfied')
    expect(template.regulationTo).toBe('neutral')
  })

  it('reflection template has expected regulation map', () => {
    const template = getPhaseTemplate('reflection')
    expect(template.regulationFrom).toBe('neutral')
    expect(template.regulationTo).toBe('satisfied')
  })
})

// ---------------------------------------------------------------------------
// getReflectionTemplate — reflection-specific accessor
// ---------------------------------------------------------------------------

describe('getReflectionTemplate', () => {
  it('returns reflection template with epiphany fields', () => {
    const template = getReflectionTemplate()
    expect(template).not.toBeNull()
    expect(template!.epiphanyPrompt).toBeTruthy()
    expect(template!.epiphanySeedPhrases).toBeTruthy()
    expect(template!.allowFreeformEpiphany).toBe(true)
  })

  it('epiphany prompt has channel overrides', () => {
    const template = getReflectionTemplate()!
    expect(template.epiphanyPrompt.default).toBeTruthy()
    expect(template.epiphanyPrompt.channelOverrides).toBeTruthy()
    expect(template.epiphanyPrompt.channelOverrides!.Fear).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// resolveReflectionCompletions — static path
// ---------------------------------------------------------------------------

describe('resolveReflectionCompletions — static', () => {
  it('produces 3 suggestions for static path', async () => {
    const now = new Date()
    const mockContext: import('../reflection-aggregator').ReflectionContext = {
      playerId: 'test-player',
      channel: 'Anger' as EmotionalChannel,
      face: 'challenger' as import('@/lib/quest-grammar/types').GameMasterFace,
      waveMove: 'wakeUp' as import('@/lib/quest-grammar/types').PersonalMoveType,
      currentPhase: 'reflection' as ArcPhase,
      arcStartedAt: now,
      intake: {
        barId: 'intake-bar-id',
        title: 'Something I was avoiding',
        content: 'My boundary was crossed',
        channel: 'Anger',
        regulationFrom: 'dissatisfied',
        regulationTo: 'neutral',
        createdAt: now,
      },
      action: {
        barId: 'action-bar-id',
        title: 'Issue Challenge',
        content: 'I will set a clear boundary',
        moveId: 'issue_challenge' as import('../types').ChallengerMoveId,
        moveTitle: 'Issue Challenge',
        canonicalMoveId: 'fire_transcend',
        energyDelta: 2,
        moveNarrative: 'Confront what needs confronting',
        channel: 'Anger',
        regulationFrom: 'neutral',
        regulationTo: 'neutral',
        createdAt: now,
      },
      regulationTrajectory: {
        intake: { from: 'dissatisfied', to: 'neutral' },
        action: { from: 'neutral', to: 'neutral' },
        reflection: { from: 'neutral', to: 'satisfied' },
      },
      reflectionPrompts: [],
      narrativeSummary: 'Test narrative summary',
    }

    const result = await resolveReflectionCompletions(mockContext, true)

    expect(result.source).toBe('static_inline')
    expect(result.fallbackReason).toBe('preferred_static')
    expect(result.completions.suggestions).toHaveLength(3)

    // Verify the 3 framings
    const keys = result.completions.suggestions.map((s) => s.key)
    expect(keys).toContain('channel_aligned')
    expect(keys).toContain('adjacent')
    expect(keys).toContain('cross')

    // Channel-aligned should be the player's channel
    const aligned = result.completions.suggestions.find((s) => s.key === 'channel_aligned')!
    expect(aligned.channel).toBe('Anger')
    expect(aligned.framing).toBe('direct')
  })
})

// ---------------------------------------------------------------------------
// Source attribution consistency
// ---------------------------------------------------------------------------

describe('source attribution', () => {
  it('template_bank source always has null model', async () => {
    const passage = await resolvePassage('intake', 'Fear', { preferStatic: true })
    if (passage.source === 'template_bank') {
      expect(passage.model).toBeNull()
    }
  })

  it('static_inline source always has null model', async () => {
    // Force a context where template bank might miss and static inline kicks in
    const passage = await resolvePassage('intake', 'Neutrality', { preferStatic: true })
    expect(passage.model).toBeNull()
  })

  it('all resolved passages have resolvedAt timestamp', async () => {
    for (const phase of ARC_PHASES) {
      const passage = await resolvePassage(phase, 'Fear', { preferStatic: true })
      expect(passage.metadata.resolvedAt).toBeTruthy()
      expect(() => new Date(passage.metadata.resolvedAt)).not.toThrow()
    }
  })

  it('aiAvailable flag is accurate', async () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const passage = await resolvePassage('intake', 'Fear', { preferStatic: true })
    expect(passage.aiAvailable).toBe(false)

    if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey
  })
})

// ---------------------------------------------------------------------------
// Non-AI first-class: content quality parity
// ---------------------------------------------------------------------------

describe('non-AI first-class: content quality', () => {
  it('template bank content is richer than static inline (channel-specific)', async () => {
    // Template bank content has channel-specific overrides
    const templatePassage = await resolvePassage('intake', 'Fear', { preferStatic: true })
    expect(templatePassage.source).toBe('template_bank')

    // Fear-specific content should reference risk/uncertainty, not generic friction
    const combined = `${templatePassage.situation} ${templatePassage.friction} ${templatePassage.invitation}`.toLowerCase()
    expect(combined).toMatch(/risk|uncertain|fear|circl|metal/)
  })

  it('intake content helps player name dissatisfaction', async () => {
    const passage = await resolvePassage('intake', 'Anger', { preferStatic: true })
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    expect(combined).toMatch(/name|boundary|cross|anger/)
  })

  it('action content challenges player to act', async () => {
    const passage = await resolvePassage('action', 'Joy', { preferStatic: true })
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    expect(combined).toMatch(/act|move|commit|grow|space/)
  })

  it('reflection content invites epiphany', async () => {
    const passage = await resolvePassage('reflection', 'Sadness', { preferStatic: true })
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    expect(combined).toMatch(/shift|see|insight|epiphany|learn/)
  })
})
