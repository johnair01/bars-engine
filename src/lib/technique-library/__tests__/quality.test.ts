import { describe, it, expect } from 'vitest'

import { assessQuality, RUBRIC } from '../quality'
import type { Technique } from '../types'
import { superpowerDeck } from '../superpowers'

const L4: Technique = {
  id: 't',
  slug: 't',
  name: 'The Warm Ask',
  essence: 'Open a real ask to someone who would want to help, without turning it into a ledger.',
  steps: [
    'List ten people who would be glad to be asked.',
    'For each, name a specific amount and a true reason.',
    'Ask one today, in your own voice, with an explicit no-strings out.',
  ],
  source: { origin: 'gm' },
  moves: ['open_up'],
  operations: ['diplomat'],
  domains: [],
  channels: [],
  aspect: 'both',
  superpowers: ['connector'],
  tier: 'community',
  status: 'draft',
  primaryQuestion: 'Whose help am I afraid to receive, and what makes the ask feel like a debt?',
  campaignQuestion: 'Who would genuinely want a chance to chip in — and how do I invite them cleanly?',
  optimizesFor: 'Resource flow through warmth, not pressure.',
  forbiddenMoves: ['Mass-blast the same message', 'Imply obligation'],
  failureModes: ['Transactional scorekeeping', 'Shame-leveraging'],
  remediation: 'If it curdles, say "no strings — really," and mean it.',
  tell: { working: 'You feel cleaner after asking, win or lose.', performed: 'You track who now owes you.' },
  contraindications: ['When the relationship has no warmth yet'],
  example: 'Text Aunt Dana: "Saving for a car. Would you put $200 toward it? Totally fine if not."',
}

describe('RUBRIC', () => {
  it('has 12 criteria', () => {
    expect(RUBRIC).toHaveLength(12)
    expect(new Set(RUBRIC.map((c) => c.id)).size).toBe(12)
  })
})

describe('assessQuality', () => {
  it('a fully anatomized, in-voice card scores L4', () => {
    const a = assessQuality(L4)
    expect(a.level).toBe(4)
    expect(a.unmet).toEqual([])
  })

  it('a generated superpower card scores below L3', () => {
    const generated = superpowerDeck('connector')[0]!
    const a = assessQuality(generated)
    expect(a.level).toBeLessThan(3)
    // generated cards meet the shadow check (#9) but fail the anatomy/form criteria
    expect(a.met).toContain(9)
    expect(a.unmet).toEqual(expect.arrayContaining([1, 4, 5, 7, 8]))
  })

  it('anatomy without the trust tests caps at L2', () => {
    const l2: Technique = {
      ...L4,
      tell: undefined, // drop #8
      contraindications: undefined,
      steps: ['List ten people to ask.', 'Name an amount for each.'], // no shadow word → #9 may drop
      example: undefined,
      essence: 'Open a real ask to someone who would want to help.', // no body/consent words
      forbiddenMoves: ['Mass-blast'], // no pressure word → keep #5 but #11 relies on consent words
    }
    const a = assessQuality(l2)
    expect(a.level).toBeLessThanOrEqual(2)
    expect(a.level).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic', () => {
    expect(assessQuality(L4)).toEqual(assessQuality(L4))
  })
})
