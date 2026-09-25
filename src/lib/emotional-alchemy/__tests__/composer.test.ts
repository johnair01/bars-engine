import { describe, it, expect } from 'vitest'

import { recommendPractice, type ComposerCard, type PracticeRecommendation } from '../index'
import type {
  DiagnosticResult,
  EmotionalVector,
  DiagnosticFlag,
  HarmRelation,
  BlockerShape,
  WaveLens,
} from '../index'

// ── fixture helpers ─────────────────────────────────────────────────────────

function vec(v: Partial<EmotionalVector> & Pick<EmotionalVector, 'channel' | 'intensity' | 'target'>): EmotionalVector {
  return { altitude: v.intensity >= 4 ? 'dissatisfied' : 'neutral', ...v }
}

function diag(p: {
  vector: EmotionalVector
  shape?: BlockerShape | null
  harmRelation?: HarmRelation | null
  flags?: DiagnosticFlag[]
  time?: 2 | 10 | 30
  fuel?: 'depleted' | 'steady' | 'charged'
}): DiagnosticResult {
  return {
    vector: p.vector,
    time: p.time ?? 10,
    temporal: 'now',
    fuel: p.fuel ?? 'steady',
    shape: p.shape ?? null,
    shapeConfidence: 'high',
    feltShape: null,
    thread: { kind: 'new', label: 'fixture' },
    harmRelation: p.harmRelation ?? null,
    layerChecked: false,
    flags: p.flags ?? [],
  }
}

function card(submove: WaveLens, stanceQuestion?: string): ComposerCard {
  return { submove, stanceQuestion }
}

function practice(rec: ReturnType<typeof recommendPractice>): PracticeRecommendation {
  if (rec.kind !== 'practice') throw new Error(`expected practice, got ${rec.kind}`)
  return rec
}

// ── the 16 golden scenarios (Atlas §6) ──────────────────────────────────────
// Each row: card submove, vector, shape → expected primary tool + prepend.

describe('golden scenarios S1–S16 (Atlas §6 fixtures)', () => {
  it('S1 · Interrupted Colleague — Anger 6 → Triumph · Show Up × Challenger · interpersonal_live → T06', () => {
    const r = practice(recommendPractice(card('show_up'), diag({ vector: vec({ channel: 'anger', intensity: 6, target: 'triumph' }), shape: 'interpersonal_live', flags: ['safety_power_over'] })))
    expect(r.primaryToolId).toBe('T06')
    expect(r.prepend).toBeNull()
    expect(r.showUp.externalGated).toBe(true) // power-over
  })

  it('S2 · Invisible Labor — Anger 5 → Peace (translate) · Clean Up · belief_sentence → T04', () => {
    const r = practice(recommendPractice(card('clean_up'), diag({ vector: vec({ channel: 'anger', intensity: 5, target: 'peace' }), shape: 'belief_sentence' })))
    expect(r.primaryToolId).toBe('T04')
    expect(r.rolePath).toEqual(['metabolize', 'translate']) // cross-channel
  })

  it('S3 · Called In — Anger 7 → Peace · Open Up × Challenger · imagined_other → T07 prepend + T01', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'anger', intensity: 7, target: 'peace' }), shape: 'imagined_other' })))
    expect(r.prepend).toBe('T07')
    expect(r.primaryToolId).toBe('T01')
    expect(r.guardsApplied).toContain('hot_charge')
  })

  it('S4 · Ballot Measure — Sadness 6 → Poignance · Open Up × Sage · unclear_heavy_body → T02 (T04 grief-blocked)', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'sadness', intensity: 6, target: 'poignance' }), shape: 'unclear_heavy_body' })))
    expect(r.primaryToolId).toBe('T02')
    expect(r.guardsApplied).toContain('grief_inquiry_block')
  })

  it('S5 · Ruptured Friendship — Sadness 5 → Poignance · Grow Up × Diplomat · two_voices → T01', () => {
    const r = practice(recommendPractice(card('grow_up'), diag({ vector: vec({ channel: 'sadness', intensity: 5, target: 'poignance' }), shape: 'two_voices' })))
    expect(r.primaryToolId).toBe('T01')
  })

  it('S6 · Workshop Terror — Fear 6 → Wonder · Grow Up × Architect · practice_edge → T11', () => {
    const r = practice(recommendPractice(card('grow_up'), diag({ vector: vec({ channel: 'fear', intensity: 6, target: 'wonder' }), shape: 'practice_edge' })))
    expect(r.primaryToolId).toBe('T11')
  })

  it('S7 · The Ask — Fear 5 → Wonder · Open Up × Challenger · imagined_other → T01', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'fear', intensity: 5, target: 'wonder' }), shape: 'imagined_other' })))
    expect(r.primaryToolId).toBe('T01')
  })

  it('S8 · Before the March — Fear 7 → Peace · Clean Up × Shaman · many_items → T07 prepend + T05', () => {
    const r = practice(recommendPractice(card('clean_up'), diag({ vector: vec({ channel: 'fear', intensity: 7, target: 'peace' }), shape: 'many_items' })))
    expect(r.prepend).toBe('T07')
    expect(r.primaryToolId).toBe('T05')
  })

  it('S9 · Win Nobody Toasted — Joy 5 → Bliss · Show Up × Sage · win_wont_land → T09 (joy guard N/A)', () => {
    const r = practice(recommendPractice(card('show_up'), diag({ vector: vec({ channel: 'joy', intensity: 5, target: 'bliss' }), shape: 'win_wont_land' })))
    expect(r.primaryToolId).toBe('T09')
    expect(r.guardsApplied).not.toContain('joy_tool_block')
  })

  it('S10 · Grim Duty — Joy 4 → Bliss · Grow Up × Shaman · practice_edge → T11', () => {
    const r = practice(recommendPractice(card('grow_up'), diag({ vector: vec({ channel: 'joy', intensity: 4, target: 'bliss' }), shape: 'practice_edge' })))
    expect(r.primaryToolId).toBe('T11')
  })

  it('S11 · Three Orgs — Neutrality 6 → Peace · Wake Up × Regent · many_items → T05', () => {
    const r = practice(recommendPractice(card('wake_up'), diag({ vector: vec({ channel: 'neutrality', intensity: 6, target: 'peace' }), shape: 'many_items', flags: ['numbness_verified'] })))
    expect(r.primaryToolId).toBe('T05')
    expect(r.rolePath).toEqual(['transcend']) // same-channel, non-metabolizer
  })

  it('S12 · The Nothing — frozen_suspected pins T02', () => {
    const r = practice(recommendPractice(card('wake_up'), diag({ vector: vec({ channel: 'sadness', intensity: 3, target: 'poignance' }), flags: ['frozen_suspected', 'numbness_verified'] })))
    expect(r.primaryToolId).toBe('T02')
  })

  it('S13 · guard fixture — Anger 8 blocks T09, prepends T07', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'anger', intensity: 8, target: 'triumph' }) })))
    expect(r.prepend).toBe('T07')
    expect(r.guardsApplied).toContain('joy_tool_block')
    expect(r.primaryToolId).not.toBe('T09')
  })

  it('S14 · exit fixture — capture-only short-circuits', () => {
    const r = recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'sadness', intensity: 6, target: 'poignance' }), flags: ['capture_only'] }))
    expect(r.kind).toBe('capture_only')
  })

  it('S15 · safety fixture — power-over gates external', () => {
    const r = practice(recommendPractice(card('show_up'), diag({ vector: vec({ channel: 'anger', intensity: 6, target: 'triumph' }), shape: 'interpersonal_live', flags: ['safety_power_over'] })))
    expect(r.showUp.externalGated).toBe(true)
    expect(r.guardsApplied).toContain('external_gate')
  })

  it('S16 · received-harm — Anger 7, no default external toward the harmer', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'anger', intensity: 7, target: 'triumph' }), harmRelation: 'received' })))
    expect(r.prepend).toBe('T07')
    expect(r.showUp.external).toBeNull()
    expect(r.guardsApplied).toContain('external_gate')
  })
})

// ── crisis / capture short-circuits ─────────────────────────────────────────

describe('short-circuits', () => {
  it('crisis flag → kind crisis, no tool', () => {
    const r = recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'fear', intensity: 10, target: 'wonder' }), flags: ['crisis'] }))
    expect(r.kind).toBe('crisis')
  })
})

// ── guards in isolation (§9.2 — hard, not advisory) ─────────────────────────

describe('hard guards', () => {
  it('T04 blocked on fresh grief (sadness + dissatisfied)', () => {
    const r = practice(recommendPractice(card('clean_up'), diag({ vector: vec({ channel: 'sadness', intensity: 6, target: 'poignance' }), shape: 'belief_sentence' })))
    expect(r.primaryToolId).not.toBe('T04')
    expect(r.guardsApplied).toContain('grief_inquiry_block')
  })

  it('T08 blocked on early sadness', () => {
    const r = practice(recommendPractice(card('show_up'), diag({ vector: vec({ channel: 'sadness', intensity: 5, target: 'poignance' }) })))
    expect(r.primaryToolId).not.toBe('T08')
    expect(r.guardsApplied).toContain('action_on_grief_block')
  })

  it('T09/T11 blocked at sadness ≥ 5', () => {
    const r = practice(recommendPractice(card('open_up'), diag({ vector: vec({ channel: 'sadness', intensity: 5, target: 'poignance' }) })))
    expect(r.primaryToolId).not.toBe('T09')
  })

  it('depleted fuel restricts to reset/capture tools', () => {
    const r = practice(recommendPractice(card('clean_up'), diag({ vector: vec({ channel: 'neutrality', intensity: 3, target: 'peace' }), fuel: 'depleted' })))
    expect(['T07', 'T03', 'T09']).toContain(r.primaryToolId)
    expect(r.timeboxMinutes).toBeLessThanOrEqual(5)
  })

  it('two-minute budget restricts to T03/T07 and uses mini steps where available', () => {
    const r = practice(recommendPractice(card('wake_up'), diag({ vector: vec({ channel: 'neutrality', intensity: 3, target: 'peace' }), time: 2 })))
    expect(['T03', 'T07']).toContain(r.primaryToolId)
    expect(r.timeboxMinutes).toBeLessThanOrEqual(2)
  })
})

// ── rendering ────────────────────────────────────────────────────────────────

describe('rendering (§5.1–5.3)', () => {
  it('appends the spirit step and returns the stance question', () => {
    const r = practice(recommendPractice(card('clean_up', 'What story am I believing?'), diag({ vector: vec({ channel: 'anger', intensity: 5, target: 'peace' }), shape: 'belief_sentence' })))
    expect(r.stanceQuestion).toBe('What story am I believing?')
    expect(r.spiritStep).toBe('What would let this settle is ___.') // peace
    expect(r.protocol[r.protocol.length - 1]).toBe(r.spiritStep)
    expect(r.protocol.length).toBeGreaterThan(1)
  })

  it('surfaces candidate reasoning (top scored, inspectable)', () => {
    const r = practice(recommendPractice(card('clean_up'), diag({ vector: vec({ channel: 'anger', intensity: 5, target: 'peace' }), shape: 'belief_sentence' })))
    expect(r.candidatesConsidered.length).toBeGreaterThan(0)
    expect(r.candidatesConsidered[0].toolId).toBe(r.primaryToolId)
    expect(r.candidatesConsidered[0].score).toBeGreaterThanOrEqual(r.candidatesConsidered[r.candidatesConsidered.length - 1].score)
  })

  it('bridges a hot Show Up card to a Clean Up tool and banks the card', () => {
    const r = practice(recommendPractice(card('show_up'), diag({ vector: vec({ channel: 'fear', intensity: 8, target: 'wonder' }), shape: 'many_items' })))
    expect(r.prepend).toBe('T07')
    expect(r.bridged).toBe(true)
    expect(r.bankedCardAim).toBe(true)
    expect(r.effectiveSubmove).toBe('clean_up')
  })
})
