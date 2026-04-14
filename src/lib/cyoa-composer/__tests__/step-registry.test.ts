/**
 * CYOA Composer — Step Registry Tests
 *
 * Tests the default step definitions, step ordering resolution,
 * GM override parsing/serialization, and validation logic.
 *
 * These are pure unit tests — no DB or server actions involved.
 */

import { describe, it, expect } from 'vitest'
import {
  getDefaultSteps,
  getDefaultStep,
  resolveStepOrder,
  getNextActiveStep,
  getRemainingStepCount,
  validateStepOverrides,
  parseComposerStepOverrides,
  serializeComposerStepOverrides,
} from '../step-registry'
import type {
  ComposerStepOverrides,
  ComposerDataBag,
  ComposerStepOverridesDb,
} from '../types'

// ---------------------------------------------------------------------------
// getDefaultSteps
// ---------------------------------------------------------------------------

describe('getDefaultSteps', () => {
  it('returns 5 steps in priority order', () => {
    const steps = getDefaultSteps()
    expect(steps).toHaveLength(5)
    expect(steps.map((s) => s.id)).toEqual([
      'emotional_checkin',
      'face_selection',
      'narrative_template',
      'charge_text',
      'confirmation',
    ])
  })

  it('returns a mutable copy (not the frozen original)', () => {
    const a = getDefaultSteps()
    const b = getDefaultSteps()
    expect(a).not.toBe(b)
    // Should be modifiable without throwing
    a[0].priority = 999
    expect(getDefaultSteps()[0].priority).toBe(10) // original unchanged
  })

  it('has spaced priorities (10, 20, 30, 40, 50)', () => {
    const steps = getDefaultSteps()
    expect(steps.map((s) => s.priority)).toEqual([10, 20, 30, 40, 50])
  })
})

// ---------------------------------------------------------------------------
// getDefaultStep
// ---------------------------------------------------------------------------

describe('getDefaultStep', () => {
  it('returns the step for a valid ID', () => {
    const step = getDefaultStep('face_selection')
    expect(step).toBeDefined()
    expect(step!.id).toBe('face_selection')
    expect(step!.label).toBe('Choose your guide')
  })

  it('returns undefined for an unknown ID', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getDefaultStep('nonexistent' as any)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// resolveStepOrder
// ---------------------------------------------------------------------------

describe('resolveStepOrder', () => {
  const emptyBag: ComposerDataBag = {}

  it('returns all steps in default order with no overrides', () => {
    const resolved = resolveStepOrder(emptyBag)
    expect(resolved).toHaveLength(5)
    expect(resolved.map((s) => s.id)).toEqual([
      'emotional_checkin',
      'face_selection',
      'narrative_template',
      'charge_text',
      'confirmation',
    ])
    // All should be non-skipped
    expect(resolved.every((s) => !s.skipped)).toBe(true)
  })

  it('reorders steps when GM provides priority overrides', () => {
    const overrides: ComposerStepOverrides = {
      face_selection: 5,     // before emotional_checkin
      charge_text: 15,       // between emotional_checkin and narrative_template
    }
    const resolved = resolveStepOrder(emptyBag, overrides)
    const ids = resolved.map((s) => s.id)
    expect(ids[0]).toBe('face_selection')       // priority 5
    expect(ids[1]).toBe('emotional_checkin')     // priority 10
    expect(ids[2]).toBe('charge_text')           // priority 15
    expect(ids[3]).toBe('narrative_template')    // priority 30
    expect(ids[4]).toBe('confirmation')          // priority 50
  })

  it('disables steps when GM sets enabled: false', () => {
    const overrides: ComposerStepOverrides = {
      charge_text: { priority: 40, enabled: false },
    }
    const resolved = resolveStepOrder(emptyBag, overrides)
    const chargeStep = resolved.find((s) => s.id === 'charge_text')
    expect(chargeStep).toBeDefined()
    expect(chargeStep!.skipped).toBe(true)
  })

  it('skips steps when skipCondition is satisfied', () => {
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
    const resolved = resolveStepOrder(bag)
    const checkinStep = resolved.find((s) => s.id === 'emotional_checkin')
    expect(checkinStep!.skipped).toBe(true)
  })

  it('confirmation step is never auto-skipped', () => {
    const fullBag: ComposerDataBag = {
      emotionalVector: {
        channelFrom: 'Fear',
        altitudeFrom: 'dissatisfied',
        channelTo: 'Joy',
        altitudeTo: 'satisfied',
      },
      channel: 'Joy',
      altitude: 'satisfied',
      lockedFace: 'shaman',
      narrativeTemplateId: 'template-1',
      chargeText: 'My intention',
    }
    const resolved = resolveStepOrder(fullBag)
    const confirmStep = resolved.find((s) => s.id === 'confirmation')
    expect(confirmStep!.skipped).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getNextActiveStep
// ---------------------------------------------------------------------------

describe('getNextActiveStep', () => {
  it('returns the first non-skipped step', () => {
    const step = getNextActiveStep({})
    expect(step).not.toBeNull()
    expect(step!.id).toBe('emotional_checkin')
  })

  it('returns null when all steps are skipped/disabled', () => {
    const overrides: ComposerStepOverrides = {
      emotional_checkin: { enabled: false },
      face_selection: { enabled: false },
      narrative_template: { enabled: false },
      charge_text: { enabled: false },
      confirmation: { enabled: false },
    }
    const step = getNextActiveStep({}, overrides)
    expect(step).toBeNull()
  })

  it('skips pre-filled steps and returns next active', () => {
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
    const step = getNextActiveStep(bag)
    expect(step!.id).toBe('face_selection')
  })
})

// ---------------------------------------------------------------------------
// getRemainingStepCount
// ---------------------------------------------------------------------------

describe('getRemainingStepCount', () => {
  it('returns 5 for empty data bag', () => {
    expect(getRemainingStepCount({})).toBe(5)
  })

  it('decreases when steps are disabled', () => {
    const overrides: ComposerStepOverrides = {
      charge_text: { enabled: false },
    }
    expect(getRemainingStepCount({}, overrides)).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// validateStepOverrides
// ---------------------------------------------------------------------------

describe('validateStepOverrides', () => {
  it('returns empty for valid overrides', () => {
    const overrides: ComposerStepOverrides = {
      face_selection: 5,
      charge_text: { priority: 15, enabled: true },
    }
    expect(validateStepOverrides(overrides)).toEqual([])
  })

  it('returns empty for null/undefined', () => {
    expect(validateStepOverrides(null)).toEqual([])
    expect(validateStepOverrides(undefined)).toEqual([])
  })

  it('rejects unknown step IDs', () => {
    const bad = { unknown_step: 10 }
    const errors = validateStepOverrides(bad)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('Unknown step ID')
  })

  it('rejects non-object input', () => {
    expect(validateStepOverrides('string')).toEqual([
      'Step overrides must be a plain object',
    ])
    expect(validateStepOverrides([1, 2])).toEqual([
      'Step overrides must be a plain object',
    ])
  })

  it('rejects non-finite priorities', () => {
    const bad = { face_selection: Infinity }
    const errors = validateStepOverrides(bad)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('finite number')
  })

  it('rejects invalid enabled flag type', () => {
    const bad = { face_selection: { enabled: 'yes' } }
    const errors = validateStepOverrides(bad)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('boolean')
  })
})

// ---------------------------------------------------------------------------
// parseComposerStepOverrides
// ---------------------------------------------------------------------------

describe('parseComposerStepOverrides', () => {
  it('returns null for null/undefined', () => {
    expect(parseComposerStepOverrides(null)).toBeNull()
    expect(parseComposerStepOverrides(undefined)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseComposerStepOverrides('string')).toBeNull()
    expect(parseComposerStepOverrides(42)).toBeNull()
    expect(parseComposerStepOverrides([1, 2])).toBeNull()
  })

  it('parses canonical DB array format', () => {
    const db: ComposerStepOverridesDb = {
      steps: [
        { key: 'face_selection', enabled: true, order: 5 },
        { key: 'charge_text', enabled: false, order: 40 },
      ],
    }
    const result = parseComposerStepOverrides(db)
    expect(result).not.toBeNull()
    expect(result!.face_selection).toEqual({ priority: 5, enabled: true })
    expect(result!.charge_text).toEqual({ priority: 40, enabled: false })
  })

  it('parses flat map format', () => {
    const flat: ComposerStepOverrides = {
      face_selection: 5,
      charge_text: { priority: 15, enabled: true },
    }
    const result = parseComposerStepOverrides(flat)
    expect(result).not.toBeNull()
    expect(result!.face_selection).toBe(5)
    expect(result!.charge_text).toEqual({ priority: 15, enabled: true })
  })

  it('returns null for invalid flat map (unknown step IDs)', () => {
    const bad = { totally_unknown: 10 }
    expect(parseComposerStepOverrides(bad)).toBeNull()
  })

  it('returns null for empty DB steps array', () => {
    expect(parseComposerStepOverrides({ steps: [] })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// serializeComposerStepOverrides
// ---------------------------------------------------------------------------

describe('serializeComposerStepOverrides', () => {
  it('returns null for null/undefined', () => {
    expect(serializeComposerStepOverrides(null)).toBeNull()
    expect(serializeComposerStepOverrides(undefined)).toBeNull()
  })

  it('serializes numeric overrides', () => {
    const overrides: ComposerStepOverrides = { face_selection: 5 }
    const result = serializeComposerStepOverrides(overrides)
    expect(result).not.toBeNull()
    expect(result!.steps).toEqual([
      { key: 'face_selection', enabled: true, order: 5 },
    ])
  })

  it('serializes object overrides', () => {
    const overrides: ComposerStepOverrides = {
      charge_text: { priority: 15, enabled: false },
    }
    const result = serializeComposerStepOverrides(overrides)
    expect(result).not.toBeNull()
    expect(result!.steps).toEqual([
      { key: 'charge_text', enabled: false, order: 15 },
    ])
  })

  it('sorts output steps by order', () => {
    const overrides: ComposerStepOverrides = {
      confirmation: 100,
      emotional_checkin: 1,
      face_selection: 50,
    }
    const result = serializeComposerStepOverrides(overrides)
    expect(result!.steps.map((s) => s.key)).toEqual([
      'emotional_checkin',
      'face_selection',
      'confirmation',
    ])
  })

  it('round-trips through parse → serialize → parse', () => {
    const original: ComposerStepOverrides = {
      face_selection: { priority: 5, enabled: true },
      charge_text: { priority: 45, enabled: false },
    }
    const serialized = serializeComposerStepOverrides(original)
    const parsed = parseComposerStepOverrides(serialized)
    expect(parsed).not.toBeNull()
    expect(parsed!.face_selection).toEqual({ priority: 5, enabled: true })
    expect(parsed!.charge_text).toEqual({ priority: 45, enabled: false })
  })
})
