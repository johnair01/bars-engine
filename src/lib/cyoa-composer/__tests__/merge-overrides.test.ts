/**
 * CYOA Composer — Override Merge Logic Tests
 *
 * Tests the multi-layer merge utility that layers GM campaign overrides
 * on top of universal default step priorities.
 *
 * Pure unit tests — no DB or server actions involved.
 */

import { describe, it, expect } from 'vitest'
import {
  mergeOverrideLayers,
  mergeCampaignOverrides,
  resolveStepOrderWithLayers,
  resolveCampaignStepOrder,
  getNextActiveStepFromLayers,
  getRemainingStepCountFromLayers,
} from '../merge-overrides'
import type { OverrideLayer } from '../merge-overrides'
import type { ComposerStepOverrides, ComposerDataBag } from '../types'

// ---------------------------------------------------------------------------
// mergeOverrideLayers
// ---------------------------------------------------------------------------

describe('mergeOverrideLayers', () => {
  it('returns empty merged map when no layers have overrides', () => {
    const result = mergeOverrideLayers([])
    expect(result.merged).toEqual({})
    expect(result.attribution).toEqual({})
    expect(result.hasOverrides).toBe(false)
  })

  it('returns empty merged map when all layers are null', () => {
    const result = mergeOverrideLayers([
      { source: 'instance', overrides: null },
      { source: 'adventure_template', overrides: null },
    ])
    expect(result.hasOverrides).toBe(false)
  })

  it('applies a single layer of overrides', () => {
    const overrides: ComposerStepOverrides = {
      face_selection: 5,
      charge_text: { priority: 15, enabled: false },
    }
    const result = mergeOverrideLayers([
      { source: 'instance', overrides },
    ])
    expect(result.merged.face_selection).toBe(5)
    expect(result.merged.charge_text).toEqual({ priority: 15, enabled: false })
    expect(result.attribution.face_selection).toBe('instance')
    expect(result.attribution.charge_text).toBe('instance')
    expect(result.hasOverrides).toBe(true)
  })

  it('higher-precedence layer wins for the same step key', () => {
    const instanceOverrides: ComposerStepOverrides = {
      face_selection: 5,
    }
    const templateOverrides: ComposerStepOverrides = {
      face_selection: 15,
      charge_text: { priority: 35, enabled: true },
    }
    const result = mergeOverrideLayers([
      { source: 'instance', overrides: instanceOverrides },
      { source: 'adventure_template', overrides: templateOverrides },
    ])
    // Instance wins for face_selection
    expect(result.merged.face_selection).toBe(5)
    expect(result.attribution.face_selection).toBe('instance')
    // Template provides charge_text (not in instance)
    expect(result.merged.charge_text).toEqual({ priority: 35, enabled: true })
    expect(result.attribution.charge_text).toBe('adventure_template')
  })

  it('null higher-precedence layer falls through to lower', () => {
    const templateOverrides: ComposerStepOverrides = {
      face_selection: 15,
    }
    const result = mergeOverrideLayers([
      { source: 'instance', overrides: null },
      { source: 'adventure_template', overrides: templateOverrides },
    ])
    expect(result.merged.face_selection).toBe(15)
    expect(result.attribution.face_selection).toBe('adventure_template')
  })

  it('supports three or more layers', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { face_selection: 1 } },
      { source: 'template', overrides: { face_selection: 2, charge_text: 25 } },
      { source: 'global', overrides: { face_selection: 3, charge_text: 35, emotional_checkin: 5 } },
    ]
    const result = mergeOverrideLayers(layers)
    // Instance wins face_selection
    expect(result.merged.face_selection).toBe(1)
    expect(result.attribution.face_selection).toBe('instance')
    // Template wins charge_text
    expect(result.merged.charge_text).toBe(25)
    expect(result.attribution.charge_text).toBe('template')
    // Global provides emotional_checkin
    expect(result.merged.emotional_checkin).toBe(5)
    expect(result.attribution.emotional_checkin).toBe('global')
  })

  it('skips null values within an override map', () => {
    const overrides: ComposerStepOverrides = {
      face_selection: 5,
    }
    // Simulate a sparse override where some keys might be null-ish
    ;(overrides as Record<string, unknown>).charge_text = null
    const result = mergeOverrideLayers([
      { source: 'instance', overrides },
    ])
    expect(result.merged.face_selection).toBe(5)
    expect('charge_text' in result.merged).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// mergeCampaignOverrides
// ---------------------------------------------------------------------------

describe('mergeCampaignOverrides', () => {
  it('merges instance over template', () => {
    const result = mergeCampaignOverrides(
      { face_selection: 5 },
      { face_selection: 15, charge_text: 25 },
    )
    expect(result.merged.face_selection).toBe(5)
    expect(result.attribution.face_selection).toBe('instance')
    expect(result.merged.charge_text).toBe(25)
    expect(result.attribution.charge_text).toBe('adventure_template')
  })

  it('returns no overrides when both are null', () => {
    const result = mergeCampaignOverrides(null, null)
    expect(result.hasOverrides).toBe(false)
  })

  it('uses template when instance is null', () => {
    const result = mergeCampaignOverrides(null, { face_selection: 15 })
    expect(result.merged.face_selection).toBe(15)
    expect(result.attribution.face_selection).toBe('adventure_template')
  })

  it('uses instance when template is null', () => {
    const result = mergeCampaignOverrides({ face_selection: 5 }, null)
    expect(result.merged.face_selection).toBe(5)
    expect(result.attribution.face_selection).toBe('instance')
  })
})

// ---------------------------------------------------------------------------
// resolveStepOrderWithLayers
// ---------------------------------------------------------------------------

describe('resolveStepOrderWithLayers', () => {
  const emptyBag: ComposerDataBag = {}

  it('returns default order with no layers', () => {
    const resolved = resolveStepOrderWithLayers(emptyBag, [])
    expect(resolved).toHaveLength(5)
    expect(resolved.map((s) => s.id)).toEqual([
      'emotional_checkin',
      'face_selection',
      'narrative_template',
      'charge_text',
      'confirmation',
    ])
    expect(resolved.every((s) => !s.hasOverride)).toBe(true)
    expect(resolved.every((s) => s.overrideSource === null)).toBe(true)
  })

  it('applies merged priorities from multiple layers', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { face_selection: 5 } },
      { source: 'template', overrides: { charge_text: 15 } },
    ]
    const resolved = resolveStepOrderWithLayers(emptyBag, layers)
    const ids = resolved.map((s) => s.id)
    expect(ids[0]).toBe('face_selection')       // priority 5 (instance)
    expect(ids[1]).toBe('emotional_checkin')     // priority 10 (default)
    expect(ids[2]).toBe('charge_text')           // priority 15 (template)
    expect(ids[3]).toBe('narrative_template')    // priority 30 (default)
    expect(ids[4]).toBe('confirmation')          // priority 50 (default)
  })

  it('instance disable overrides template enable', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { charge_text: { enabled: false } } },
      { source: 'template', overrides: { charge_text: { priority: 15, enabled: true } } },
    ]
    const resolved = resolveStepOrderWithLayers(emptyBag, layers)
    const chargeStep = resolved.find((s) => s.id === 'charge_text')
    expect(chargeStep!.skipped).toBe(true)
    expect(chargeStep!.overrideSource).toBe('instance')
  })

  it('preserves defaultPriority on each step', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { face_selection: 99 } },
    ]
    const resolved = resolveStepOrderWithLayers(emptyBag, layers)
    const faceStep = resolved.find((s) => s.id === 'face_selection')
    expect(faceStep!.defaultPriority).toBe(20)
    expect(faceStep!.effectivePriority).toBe(99)
  })

  it('evaluates skipConditions against data bag', () => {
    const bag: ComposerDataBag = {
      emotionalVector: {
        channelFrom: 'Fear',
        altitudeFrom: 'dissatisfied',
        channelTo: 'Joy',
        altitudeTo: 'satisfied',
      },
      channel: 'Joy',
      altitude: 'satisfied',
    }
    const resolved = resolveStepOrderWithLayers(bag, [])
    const checkinStep = resolved.find((s) => s.id === 'emotional_checkin')
    expect(checkinStep!.skipped).toBe(true)
  })

  it('disabled step is skipped even if skipCondition would not skip', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { emotional_checkin: { enabled: false } } },
    ]
    const resolved = resolveStepOrderWithLayers(emptyBag, layers)
    const checkinStep = resolved.find((s) => s.id === 'emotional_checkin')
    expect(checkinStep!.skipped).toBe(true)
  })

  it('attribution tracks which layer contributed each step', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { face_selection: 5 } },
      { source: 'template', overrides: { face_selection: 15, charge_text: 25 } },
    ]
    const resolved = resolveStepOrderWithLayers(emptyBag, layers)
    const faceStep = resolved.find((s) => s.id === 'face_selection')
    const chargeStep = resolved.find((s) => s.id === 'charge_text')
    const confirmStep = resolved.find((s) => s.id === 'confirmation')
    expect(faceStep!.overrideSource).toBe('instance')
    expect(chargeStep!.overrideSource).toBe('template')
    expect(confirmStep!.overrideSource).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// resolveCampaignStepOrder
// ---------------------------------------------------------------------------

describe('resolveCampaignStepOrder', () => {
  const emptyBag: ComposerDataBag = {}

  it('merges instance + template overrides into final order', () => {
    const resolved = resolveCampaignStepOrder(
      emptyBag,
      { face_selection: 5 },                           // instance: face first
      { charge_text: { priority: 12, enabled: true } }, // template: charge early
    )
    const ids = resolved.map((s) => s.id)
    expect(ids[0]).toBe('face_selection')       // 5
    expect(ids[1]).toBe('emotional_checkin')     // 10
    expect(ids[2]).toBe('charge_text')           // 12
    expect(ids[3]).toBe('narrative_template')    // 30
    expect(ids[4]).toBe('confirmation')          // 50
  })

  it('defaults when both overrides are null', () => {
    const resolved = resolveCampaignStepOrder(emptyBag, null, null)
    expect(resolved.map((s) => s.id)).toEqual([
      'emotional_checkin',
      'face_selection',
      'narrative_template',
      'charge_text',
      'confirmation',
    ])
    expect(resolved.every((s) => !s.hasOverride)).toBe(true)
  })

  it('instance-disabled step is skipped even if template enables it', () => {
    const resolved = resolveCampaignStepOrder(
      emptyBag,
      { charge_text: { enabled: false } },
      { charge_text: { priority: 15, enabled: true } },
    )
    const charge = resolved.find((s) => s.id === 'charge_text')
    expect(charge!.skipped).toBe(true)
    expect(charge!.overrideSource).toBe('instance')
  })
})

// ---------------------------------------------------------------------------
// getNextActiveStepFromLayers
// ---------------------------------------------------------------------------

describe('getNextActiveStepFromLayers', () => {
  it('returns first active step with layered overrides', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { face_selection: 5 } },
    ]
    const step = getNextActiveStepFromLayers({}, layers)
    expect(step).not.toBeNull()
    expect(step!.id).toBe('face_selection')
  })

  it('returns null when all steps are disabled', () => {
    const layers: OverrideLayer[] = [
      {
        source: 'instance',
        overrides: {
          emotional_checkin: { enabled: false },
          face_selection: { enabled: false },
          narrative_template: { enabled: false },
          charge_text: { enabled: false },
          confirmation: { enabled: false },
        },
      },
    ]
    const step = getNextActiveStepFromLayers({}, layers)
    expect(step).toBeNull()
  })

  it('skips pre-filled steps and returns next', () => {
    const bag: ComposerDataBag = {
      emotionalVector: {
        channelFrom: 'Fear',
        altitudeFrom: 'dissatisfied',
        channelTo: 'Joy',
        altitudeTo: 'satisfied',
      },
      channel: 'Joy',
      altitude: 'satisfied',
    }
    const step = getNextActiveStepFromLayers(bag, [])
    expect(step!.id).toBe('face_selection')
  })
})

// ---------------------------------------------------------------------------
// getRemainingStepCountFromLayers
// ---------------------------------------------------------------------------

describe('getRemainingStepCountFromLayers', () => {
  it('returns 5 for empty bag and no layers', () => {
    expect(getRemainingStepCountFromLayers({}, [])).toBe(5)
  })

  it('decreases when steps are disabled via layers', () => {
    const layers: OverrideLayer[] = [
      { source: 'instance', overrides: { charge_text: { enabled: false } } },
    ]
    expect(getRemainingStepCountFromLayers({}, layers)).toBe(4)
  })

  it('decreases when data bag causes skip', () => {
    const bag: ComposerDataBag = {
      emotionalVector: {
        channelFrom: 'Fear',
        altitudeFrom: 'dissatisfied',
        channelTo: 'Joy',
        altitudeTo: 'satisfied',
      },
      channel: 'Joy',
      altitude: 'satisfied',
      lockedFace: 'shaman',
    }
    // emotional_checkin and face_selection both skipped
    expect(getRemainingStepCountFromLayers(bag, [])).toBe(3)
  })
})
