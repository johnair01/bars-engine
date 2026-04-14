/**
 * Alchemy Engine — AI Generation Service Tests
 *
 * Tests the passage generation service for all 3 arc phases.
 * Validates:
 *   - Static (non-AI) fallback produces valid content for all phase × channel combos
 *   - Prompt building routes correctly per phase
 *   - Scene context validation
 *   - Output schema conformance
 *   - Non-AI path is first-class (always works without API key)
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
  buildPrompts,
  buildStaticPassage,
  generatedPassageSchema,
  isAIGenerationAvailable,
  type SceneContext,
  type GeneratedPassage,
} from '../ai-generation'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'
import type { ArcPhase } from '../types'
import { ARC_PHASES, VERTICAL_SLICE } from '../types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const ALL_CHANNELS: EmotionalChannel[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality']

function makeSceneContext(overrides?: Partial<SceneContext>): SceneContext {
  return {
    phase: 'intake',
    channel: 'Fear',
    face: VERTICAL_SLICE.face,
    waveMove: VERTICAL_SLICE.waveMove,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// buildStaticPassage — non-AI first-class
// ---------------------------------------------------------------------------

describe('buildStaticPassage', () => {
  it('produces valid passage for every phase × channel combination', () => {
    for (const phase of ARC_PHASES) {
      for (const channel of ALL_CHANNELS) {
        const ctx = makeSceneContext({ phase, channel })
        const passage = buildStaticPassage(ctx)

        // Every field must be a non-empty string
        expect(passage.situation).toBeTruthy()
        expect(passage.friction).toBeTruthy()
        expect(passage.invitation).toBeTruthy()

        // Source must be static
        expect(passage.source).toBe('static')
        expect(passage.model).toBeNull()

        // Metadata must match input
        expect(passage.metadata.phase).toBe(phase)
        expect(passage.metadata.channel).toBe(channel)
        expect(passage.metadata.face).toBe('challenger')
        expect(passage.metadata.waveMove).toBe('wakeUp')
        expect(passage.metadata.estimatedTokens).toBeNull()
      }
    }
  })

  it('incorporates prior content into Action phase passage', () => {
    const ctx = makeSceneContext({
      phase: 'action',
      channel: 'Anger',
      priorContent: {
        intakeText: 'I am frustrated with my creative stagnation',
      },
    })
    const passage = buildStaticPassage(ctx)

    // The friction should reference the intake text
    expect(passage.friction).toContain('frustrated with my creative stagnation')
  })

  it('incorporates prior content into Reflection phase passage', () => {
    const ctx = makeSceneContext({
      phase: 'reflection',
      channel: 'Sadness',
      priorContent: {
        intakeText: 'I miss the community I used to have',
        actionMoveTitle: 'Issue Challenge',
        actionText: 'I will reach out to three people this week',
      },
    })
    const passage = buildStaticPassage(ctx)

    // Should reference intake and action
    expect(passage.friction).toContain('miss the community')
    expect(passage.friction).toContain('issue challenge')
  })

  it('works without prior content (graceful degradation)', () => {
    for (const phase of ARC_PHASES) {
      const ctx = makeSceneContext({ phase, channel: 'Joy' })
      const passage = buildStaticPassage(ctx)

      // Should not crash and should produce non-empty content
      expect(passage.situation.length).toBeGreaterThan(10)
      expect(passage.friction.length).toBeGreaterThan(10)
      expect(passage.invitation.length).toBeGreaterThan(10)
    }
  })
})

// ---------------------------------------------------------------------------
// buildPrompts — prompt routing per phase
// ---------------------------------------------------------------------------

describe('buildPrompts', () => {
  it('routes to Intake-specific prompts', () => {
    const ctx = makeSceneContext({ phase: 'intake', channel: 'Fear' })
    const { system, user } = buildPrompts(ctx)

    expect(system).toContain('Challenger')
    expect(system).toContain('Intake')
    expect(system).toContain('Metal')
    expect(system).toContain('dissatisfied')
    expect(user).toContain('Fear')
    expect(user).toContain('Metal')
  })

  it('routes to Action-specific prompts', () => {
    const ctx = makeSceneContext({
      phase: 'action',
      channel: 'Anger',
      challengerMoveId: 'issue_challenge',
      priorContent: { intakeText: 'My boundary was crossed at work' },
    })
    const { system, user } = buildPrompts(ctx)

    expect(system).toContain('Action')
    expect(system).toContain('Fire')
    expect(system).toContain('Issue Challenge')
    expect(user).toContain('boundary was crossed')
  })

  it('routes to Reflection-specific prompts', () => {
    const ctx = makeSceneContext({
      phase: 'reflection',
      channel: 'Joy',
      priorContent: {
        intakeText: 'My creative energy has no outlet',
        actionMoveTitle: 'Declare Intention',
        actionText: 'I will write for 30 minutes every morning',
      },
    })
    const { system, user } = buildPrompts(ctx)

    expect(system).toContain('Reflection')
    expect(system).toContain('Wood')
    expect(system).toContain('epiphany')
    expect(user).toContain('creative energy')
    expect(user).toContain('Declare Intention')
  })

  it('includes Challenger face persona in all phases', () => {
    for (const phase of ARC_PHASES) {
      const ctx = makeSceneContext({ phase })
      const { system } = buildPrompts(ctx)

      expect(system).toContain('Challenger')
      expect(system).toContain('Wake Up')
      expect(system).toContain('no flattery')
    }
  })

  it('includes channel-specific element in all phases', () => {
    const channelElements: Record<EmotionalChannel, string> = {
      Fear: 'Metal',
      Anger: 'Fire',
      Sadness: 'Water',
      Joy: 'Wood',
      Neutrality: 'Earth',
    }

    for (const channel of ALL_CHANNELS) {
      for (const phase of ARC_PHASES) {
        const ctx = makeSceneContext({ phase, channel })
        const { system } = buildPrompts(ctx)
        expect(system).toContain(channelElements[channel])
      }
    }
  })
})

// ---------------------------------------------------------------------------
// generatedPassageSchema — Zod schema validation
// ---------------------------------------------------------------------------

describe('generatedPassageSchema', () => {
  it('accepts valid passage data', () => {
    const valid = {
      situation: 'Something in the Metal register has been building. A thread of unease.',
      friction: 'The discomfort is not random. Fear is a signal — what specifically is uncertain?',
      invitation: 'Name it. Not a vague feeling — a specific dissatisfaction.',
    }
    const result = generatedPassageSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty strings', () => {
    const invalid = {
      situation: '',
      friction: 'Valid friction text here with enough length.',
      invitation: 'Valid invitation text here with enough length.',
    }
    const result = generatedPassageSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects strings under minimum length', () => {
    const invalid = {
      situation: 'Too short',
      friction: 'Also too',
      invitation: 'And this',
    }
    const result = generatedPassageSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects strings over maximum length', () => {
    const tooLong = 'x'.repeat(601)
    const invalid = {
      situation: tooLong,
      friction: 'Valid friction text here with enough length.',
      invitation: 'Valid invitation text here with enough length.',
    }
    const result = generatedPassageSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isAIGenerationAvailable — environment check
// ---------------------------------------------------------------------------

describe('isAIGenerationAvailable', () => {
  const originalEnv = process.env.OPENAI_API_KEY

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENAI_API_KEY = originalEnv
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  it('returns false when OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY
    expect(isAIGenerationAvailable()).toBe(false)
  })

  it('returns false when OPENAI_API_KEY is empty', () => {
    process.env.OPENAI_API_KEY = '   '
    expect(isAIGenerationAvailable()).toBe(false)
  })

  it('returns true when OPENAI_API_KEY is set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    expect(isAIGenerationAvailable()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Phase-locked advancement validation
// ---------------------------------------------------------------------------

describe('phase-locked content', () => {
  it('Intake passage references dissatisfied regulation state', () => {
    const passage = buildStaticPassage(makeSceneContext({ phase: 'intake', channel: 'Fear' }))
    // Intake content should reference dissatisfaction, not satisfaction
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    expect(combined).toContain('dissatisf')
  })

  it('Reflection passage invites epiphany naming', () => {
    const passage = buildStaticPassage(makeSceneContext({ phase: 'reflection', channel: 'Anger' }))
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    // Should reference seeing something new / epiphany
    expect(combined).toMatch(/see now|epiphany|shifted|clear/)
  })

  it('Action passage bridges naming to commitment', () => {
    const passage = buildStaticPassage(makeSceneContext({
      phase: 'action',
      channel: 'Sadness',
      priorContent: { intakeText: 'My old friendships have faded' },
    }))
    const combined = `${passage.situation} ${passage.friction} ${passage.invitation}`.toLowerCase()
    // Should reference naming having happened and action being needed
    expect(combined).toMatch(/named|commit|do|action|move/)
  })
})

// ---------------------------------------------------------------------------
// Vertical slice scope
// ---------------------------------------------------------------------------

describe('vertical slice scope', () => {
  it('all static passages use Challenger face', () => {
    for (const phase of ARC_PHASES) {
      const passage = buildStaticPassage(makeSceneContext({ phase }))
      expect(passage.metadata.face).toBe('challenger')
    }
  })

  it('all static passages use Wake Up WAVE move', () => {
    for (const phase of ARC_PHASES) {
      const passage = buildStaticPassage(makeSceneContext({ phase }))
      expect(passage.metadata.waveMove).toBe('wakeUp')
    }
  })

  it('all prompts reference Challenger persona', () => {
    for (const phase of ARC_PHASES) {
      const { system } = buildPrompts(makeSceneContext({ phase }))
      expect(system).toContain('Challenger')
    }
  })

  it('all prompts reference Wake Up stage', () => {
    for (const phase of ARC_PHASES) {
      const { system } = buildPrompts(makeSceneContext({ phase }))
      expect(system).toContain('Wake Up')
    }
  })
})
