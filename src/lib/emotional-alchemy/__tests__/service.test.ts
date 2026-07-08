import { describe, it, expect } from 'vitest'

import {
  seedToAnswers,
  seedFromCapture,
  seedFromVibeTag,
  alchemyHref,
  seedFromParams,
  isCrisisIntensity,
  planSteps,
  type AlchemySeed,
} from '../index'

function paramsOf(href: string): URLSearchParams {
  return new URLSearchParams(href.split('?')[1] ?? '')
}

describe('seedToAnswers — diagnostic prefill (no raw text)', () => {
  it('maps structured fields; leaves blocker unseeded (§1.6)', () => {
    const a = seedToAnswers({ source: 'capture', channel: 'anger', intensity: 6, altitude: 'dissatisfied', threadLabel: 'standup thing' })
    expect(a.channelPick).toBe('anger')
    expect(a.intensity).toBe(6)
    expect(a.altitude).toBe('dissatisfied')
    expect(a.thread).toEqual({ kind: 'new', label: 'standup thing' })
    expect('blocker' in a).toBe(false)
    // the prefill is a valid input to the planner
    expect(planSteps(a)[0]).toBe('blocker')
  })
  it('clamps a bad intensity', () => {
    expect(seedToAnswers({ source: 'manual', intensity: 99 }).intensity).toBe(10)
  })
})

describe('seedFromCapture — enforces S4 (capture 1–5 can reach crisis)', () => {
  it('maps satisfaction→altitude, channel across, and normalizes intensity', () => {
    const seed = seedFromCapture({ barId: 'bar_1', channel: 'sadness', satisfaction: 'dissatisfied', intensityOneToFive: 5 })
    expect(seed.source).toBe('capture')
    expect(seed.barId).toBe('bar_1')
    expect(seed.channel).toBe('sadness')
    expect(seed.altitude).toBe('dissatisfied')
    expect(seed.intensity).toBe(10)
    expect(isCrisisIntensity(seed.intensity!)).toBe(true) // a max captured charge reaches crisis
  })
  it('omits intensity when capture had none', () => {
    expect(seedFromCapture({ barId: 'b' }).intensity).toBeUndefined()
  })
})

describe('seedFromVibeTag — EFA tag → channel hint', () => {
  it('maps clean cases and carries the tag', () => {
    expect(seedFromVibeTag('boundary-leak')).toEqual({ channel: 'anger', vibeTag: 'boundary-leak' })
    expect(seedFromVibeTag('overwhelm').channel).toBe('neutrality')
    expect(seedFromVibeTag('frozen').channel).toBe('fear')
  })
  it('leaves ambiguous tags channel-less (ask, do not infer)', () => {
    expect(seedFromVibeTag('numb').channel).toBeUndefined()
    expect(seedFromVibeTag('self-sabotage').channel).toBeUndefined()
    expect(seedFromVibeTag('other')).toEqual({ channel: undefined, vibeTag: 'other' })
  })
})

describe('alchemyHref ↔ seedFromParams round-trip', () => {
  it('round-trips a full seed', () => {
    const seed: AlchemySeed = {
      source: 'capture', channel: 'anger', intensity: 6, altitude: 'dissatisfied',
      threadLabel: 'the standup thing', drawnCardId: 'CLEAN-SO-CHALLENGER', vibeTag: 'conflict',
      barId: 'bar_123', returnTo: '/vault/charges',
    }
    expect(seedFromParams(paramsOf(alchemyHref(seed)))).toEqual(seed)
  })
  it('round-trips a minimal seed', () => {
    const seed: AlchemySeed = { source: 'manual' }
    expect(seedFromParams(paramsOf(alchemyHref(seed)))).toEqual(seed)
  })
  it('href only includes set fields', () => {
    const href = alchemyHref({ source: 'deck', drawnCardId: 'X' })
    expect(href).toContain('src=deck')
    expect(href).toContain('card=X')
    expect(href).not.toContain('ch=')
    expect(href).not.toContain('i=')
  })
})

describe('seedFromParams — validation', () => {
  it('unknown source → manual; bad enums ignored; intensity clamped', () => {
    const seed = seedFromParams(new URLSearchParams('src=bogus&ch=purple&alt=floaty&i=42'))
    expect(seed.source).toBe('manual')
    expect(seed.channel).toBeUndefined()
    expect(seed.altitude).toBeUndefined()
    expect(seed.intensity).toBe(10)
  })
  it('empty params → manual seed', () => {
    expect(seedFromParams(new URLSearchParams())).toEqual({ source: 'manual' })
  })
})
