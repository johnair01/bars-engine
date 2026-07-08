import { describe, it, expect } from 'vitest'

import {
  defaultTargetForChannel,
  defaultAltitude,
  isHotCharge,
  isCrisisIntensity,
  normalizeCaptureIntensity,
  shouldOfferLayerCheck,
  resolveFlat,
  classifyBlockerShape,
  detectSafetyTrigger,
  detectIdentityHarm,
  planSteps,
  finalizeResult,
  type DiagnosticAnswers,
  type DiagnosticResult,
  type EmotionChannel,
  type FlatAnswer,
} from '../index'
import { CAPABILITIES } from '@/lib/allyship-deck/move-library'

const CHANNELS: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

describe('defaultTargetForChannel — no drift vs CAPABILITIES', () => {
  const DISSATISFIED_TO_CHANNEL: Record<string, EmotionChannel> = {
    Anger: 'anger',
    Sadness: 'sadness',
    Fear: 'fear',
    'Joy (stuck)': 'joy',
    Neutrality: 'neutrality',
  }

  it('every channel maps to the satisfaction its capability declares', () => {
    for (const cap of CAPABILITIES) {
      const channel = DISSATISFIED_TO_CHANNEL[cap.dissatisfied]
      expect(channel, `unmapped ${cap.dissatisfied}`).toBeDefined()
      expect(defaultTargetForChannel(channel)).toBe(cap.satisfaction.toLowerCase())
    }
  })
})

describe('intensity-driven defaults (§1.3, §4, §8.2)', () => {
  it('defaultAltitude flips at 4', () => {
    expect(defaultAltitude(3)).toBe('neutral')
    expect(defaultAltitude(4)).toBe('dissatisfied')
    expect(defaultAltitude(9)).toBe('dissatisfied')
  })
  it('isHotCharge fires at 7', () => {
    expect(isHotCharge(6)).toBe(false)
    expect(isHotCharge(7)).toBe(true)
  })
  it('isCrisisIntensity fires at 9–10 (seek outside help)', () => {
    expect(isCrisisIntensity(8)).toBe(false)
    expect(isCrisisIntensity(9)).toBe(true)
    expect(isCrisisIntensity(10)).toBe(true)
  })
  it('normalizeCaptureIntensity maps capture 1–5 → 0–10, and 5 reaches the crisis range (S4)', () => {
    expect(normalizeCaptureIntensity(1)).toBe(2)
    expect(normalizeCaptureIntensity(3)).toBe(6)
    expect(normalizeCaptureIntensity(5)).toBe(10)
    expect(isCrisisIntensity(normalizeCaptureIntensity(5))).toBe(true)
    // clamps out-of-range input
    expect(normalizeCaptureIntensity(0)).toBe(2)
    expect(normalizeCaptureIntensity(9)).toBe(10)
  })
  it('layer check offered at 5', () => {
    expect(shouldOfferLayerCheck(4)).toBe(false)
    expect(shouldOfferLayerCheck(5)).toBe(true)
  })
})

describe('flat fork (§3.1)', () => {
  const cases: Array<[FlatAnswer, EmotionChannel | null, string]> = [
    ['rested_calm', 'neutrality', 'verified_rest'],
    ['walled_off', null, 'frozen_suspected'],
    ['buried', 'neutrality', 'numbness_verified'],
    ['grey', 'joy', 'numbness_verified'],
  ]
  it.each(cases)('%s → channel %s, flag %s', (answer, channel, flag) => {
    const r = resolveFlat(answer)
    expect(r.channel).toBe(channel)
    expect(r.flags).toContain(flag)
    // every flat answer records that the numbness fork ran
    expect(r.flags).toContain('numbness_verified')
  })
  it('rested_calm targets peace; grey targets bliss (joy-starved)', () => {
    expect(resolveFlat('rested_calm').targetDefault).toBe('peace')
    expect(resolveFlat('grey').targetDefault).toBe('bliss')
  })
})

describe('blocker-shape classifier (G8 — conservative)', () => {
  it('reads strong signals with high confidence', () => {
    expect(classifyBlockerShape('I am torn between two minds about him')).toEqual({ shape: 'two_voices', confidence: 'high' })
    expect(classifyBlockerShape('the Ramirez family got housed, good news')).toEqual({ shape: 'win_wont_land', confidence: 'high' })
    expect(classifyBlockerShape('seventeen commitments, too much')).toEqual({ shape: 'many_items', confidence: 'high' })
    expect(classifyBlockerShape('my first time facilitating, still learning to recover')).toEqual({ shape: 'practice_edge', confidence: 'high' })
    expect(classifyBlockerShape('my boss talked over me in the meeting')).toEqual({ shape: 'interpersonal_live', confidence: 'high' })
  })
  it('falls back to low confidence on weak signals', () => {
    expect(classifyBlockerShape('my friend and I disagree')).toEqual({ shape: 'interpersonal_live', confidence: 'low' })
  })
  it('returns null/low when nothing matches', () => {
    expect(classifyBlockerShape('the weather turned today')).toEqual({ shape: null, confidence: 'low' })
  })
})

describe('safety + identity-harm predicates (§8.5, §8.6)', () => {
  it('detects power-over safety triggers', () => {
    expect(detectSafetyTrigger('my boss keeps interrupting')).toBe(true)
    expect(detectSafetyTrigger('I might get fired for this')).toBe(true)
    expect(detectSafetyTrigger('my friend forgot my birthday')).toBe(false)
  })
  it('detects identity-based harm', () => {
    expect(detectIdentityHarm('someone used a slur at the meeting')).toBe(true)
    expect(detectIdentityHarm('they called me a name because I am trans')).toBe(true)
    expect(detectIdentityHarm('the bus was late again')).toBe(false)
  })
})

describe('planSteps (§1.3) — conditional forks', () => {
  // Neutral base: no channel-triggered harm fork, low intensity → no layer check.
  const base: Partial<DiagnosticAnswers> = { channelPick: 'neutrality', intensity: 3, blocker: 'the bus was late' }

  it('base flow has no conditional forks', () => {
    expect(planSteps(base)).toEqual([
      'blocker', 'thread', 'channel', 'intensity', 'time', 'temporal', 'fuel', 'story', 'defaults', 'summary',
    ])
  })
  it('flat pick inserts the flat fork', () => {
    expect(planSteps({ ...base, channelPick: 'flat' })).toContain('flat_fork')
  })
  it("cant_tell inserts the felt-thread handoff", () => {
    expect(planSteps({ ...base, channelPick: 'cant_tell' })).toContain('cant_tell')
  })
  it('intensity ≥ 5 inserts the layer check', () => {
    expect(planSteps({ ...base, intensity: 6 })).toContain('layer_check')
    expect(planSteps({ ...base, intensity: 4 })).not.toContain('layer_check')
  })
  it('anger/fear channel inserts the harm fork (design handoff)', () => {
    expect(planSteps({ ...base, channelPick: 'anger' })).toContain('harm_relation')
    expect(planSteps({ ...base, channelPick: 'fear' })).toContain('harm_relation')
    expect(planSteps({ ...base, channelPick: 'sadness' })).not.toContain('harm_relation')
  })
  it('identity-harm wording inserts harm_relation before defaults (any channel)', () => {
    const steps = planSteps({ ...base, channelPick: 'sadness', blocker: 'someone used a slur at me' })
    expect(steps).toContain('harm_relation')
    expect(steps.indexOf('harm_relation')).toBeLessThan(steps.indexOf('defaults'))
  })
  it('safety wording inserts the safety fork', () => {
    expect(planSteps({ ...base, blocker: 'my manager keeps overruling me' })).toContain('safety')
  })
  it('every plan ends at summary and starts at blocker', () => {
    for (const pick of ['anger', 'flat', 'cant_tell'] as const) {
      const steps = planSteps({ ...base, channelPick: pick, intensity: 8, blocker: 'my boss said a slur' })
      expect(steps[0]).toBe('blocker')
      expect(steps[steps.length - 1]).toBe('summary')
    }
  })
})

describe('finalizeResult (§1.6 structured-only + flags)', () => {
  const complete: DiagnosticAnswers = {
    blocker: 'raw blocker text that must not leak',
    story: 'raw story text that must not leak',
    thread: { kind: 'new', label: 'logistics-resentment' },
    channelPick: 'anger',
    intensity: 6,
    time: 10,
    temporal: 'now',
    fuel: 'steady',
    shape: 'belief_sentence',
    shapeConfidence: 'high',
  }

  it('produces a structured vector with visible defaults applied', () => {
    const r = finalizeResult(complete)
    expect(r.vector).toEqual({ channel: 'anger', intensity: 6, altitude: 'dissatisfied', target: 'triumph' })
    expect(r.shape).toBe('belief_sentence')
  })

  it('carries no raw blocker/story text (§1.6)', () => {
    const r = finalizeResult(complete) as DiagnosticResult & Record<string, unknown>
    const serialized = JSON.stringify(r)
    expect(serialized).not.toContain('must not leak')
    // the result shape exposes no free-text answer fields
    expect(Object.keys(r).sort()).toEqual(
      ['feltShape', 'flags', 'fuel', 'harmRelation', 'layerChecked', 'shape', 'shapeConfidence', 'temporal', 'thread', 'time', 'vector'].sort()
    )
  })

  it('carries a player-facing felt shape (channel default when unset)', () => {
    expect(finalizeResult(complete).feltShape).toBe('edge') // anger default
    expect(finalizeResult({ ...complete, feltShape: 'knot' }).feltShape).toBe('knot')
  })

  it('sets hot_charge at intensity ≥ 7', () => {
    expect(finalizeResult({ ...complete, intensity: 7 }).flags).toContain('hot_charge')
    expect(finalizeResult({ ...complete, intensity: 6 }).flags).not.toContain('hot_charge')
  })

  it('honors player edits to altitude and target', () => {
    const r = finalizeResult({ ...complete, altitude: 'neutral', target: 'peace' })
    expect(r.vector.altitude).toBe('neutral')
    expect(r.vector.target).toBe('peace') // cross-channel translate (S2)
  })

  it('propagates crisis, safety, capture-only, and layer flags', () => {
    const r = finalizeResult({
      ...complete,
      crisis: true,
      safetyPowerOver: true,
      captureOnly: true,
      layerAnswer: 'descended',
    })
    expect(r.flags).toEqual(expect.arrayContaining(['crisis', 'safety_power_over', 'capture_only', 'layer_descended']))
    expect(r.layerChecked).toBe(true)
  })

  it('flat→walled_off requires a confirmed channel', () => {
    const walled: DiagnosticAnswers = { ...complete, channelPick: 'flat', flatAnswer: 'walled_off', channelConfirmed: undefined }
    expect(() => finalizeResult(walled)).toThrow(/channelConfirmed/)
    const confirmed = finalizeResult({ ...walled, channelConfirmed: 'sadness' })
    expect(confirmed.vector.channel).toBe('sadness')
    expect(confirmed.flags).toContain('frozen_suspected')
  })

  it('flat→buried resolves to neutrality with numbness_verified', () => {
    const r = finalizeResult({ ...complete, channelPick: 'flat', flatAnswer: 'buried' })
    expect(r.vector.channel).toBe('neutrality')
    expect(r.flags).toContain('numbness_verified')
  })

  it('throws on missing required fields', () => {
    expect(() => finalizeResult({ ...complete, time: undefined })).toThrow(/time/)
    expect(() => finalizeResult({ ...complete, thread: undefined })).toThrow(/thread/)
  })
})
