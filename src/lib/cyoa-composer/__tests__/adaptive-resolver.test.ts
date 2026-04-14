/**
 * Tests for CYOA Composer — Adaptive Resolution Engine
 *
 * Validates:
 *  - Pre-filling from daily check-in skips emotional_checkin step
 *  - Pre-filling from spoke draw / CTA skips face_selection step
 *  - Checkpoint data restores partial state and skips completed steps
 *  - Priority layering: CTA > spoke draw > checkpoint
 *  - GM step overrides reorder steps correctly
 *  - Dependency validation blocks steps with unmet prerequisites
 *  - advanceAndResolve re-evaluates skipConditions after step completion
 *  - buildStateToBag extracts data from CyoaBuildState Choice fields
 */

import assert from 'node:assert'
import {
  resolveAdaptiveSteps,
  validateStepDependencies,
  canEnterStep,
  getActiveStepAtIndex,
  getActiveStepIndex,
  advanceAndResolve,
  buildStateToBag,
} from '../adaptive-resolver'
import type { PlayerComposerContext, AdaptiveResolution } from '../adaptive-resolver'
import type { ComposerDataBag } from '../types'
import type { EmotionalVector, GameMasterFace } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyContext(): PlayerComposerContext {
  return {}
}

function assertStepIds(steps: { id: string }[], expected: string[]): void {
  assert.deepStrictEqual(
    steps.map((s) => s.id),
    expected,
    `Expected step IDs [${expected.join(', ')}], got [${steps.map((s) => s.id).join(', ')}]`,
  )
}

// ---------------------------------------------------------------------------
// No pre-filled data — all steps active
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps(emptyContext())

  // All 5 default steps should be present
  assert.equal(result.steps.length, 5)

  // All steps should be active (none skipped)
  assert.equal(result.activeSteps.length, 5)
  assert.equal(result.skippedSteps.length, 0)

  // First active step should be emotional_checkin (priority 10)
  assert.equal(result.firstActiveStep?.id, 'emotional_checkin')

  // Not ready for confirmation — other steps remain
  assert.equal(result.isReadyForConfirmation, false)

  // Data bag should be empty
  assert.deepStrictEqual(result.resolvedBag, {})

  // No prefilled sources
  assert.equal(result.prefilledSources.size, 0)

  console.log('✓ empty context — all steps active')
}

// ---------------------------------------------------------------------------
// Daily check-in pre-fills emotional vector → skips emotional_checkin
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: {
      id: 'checkin-001',
      channel: 'joy',
      altitude: 'satisfied',
    },
  })

  // emotional_checkin should be skipped
  const skippedIds = result.skippedSteps.map((s) => s.id)
  assert.ok(skippedIds.includes('emotional_checkin'), 'emotional_checkin should be skipped')

  // 4 active steps remain
  assert.equal(result.activeSteps.length, 4)

  // First active step should be face_selection
  assert.equal(result.firstActiveStep?.id, 'face_selection')

  // Data bag should have emotional vector pre-filled
  assert.ok(result.resolvedBag.emotionalVector != null)
  assert.equal(result.resolvedBag.channel, 'Joy')
  assert.equal(result.resolvedBag.altitude, 'satisfied')
  assert.equal(result.resolvedBag.dailyCheckInId, 'checkin-001')

  // Vector should be: joy:satisfied -> joy:satisfied (capped at satisfied)
  assert.equal(result.resolvedBag.emotionalVector!.channelFrom, 'Joy')
  assert.equal(result.resolvedBag.emotionalVector!.altitudeFrom, 'satisfied')
  assert.equal(result.resolvedBag.emotionalVector!.channelTo, 'Joy')
  assert.equal(result.resolvedBag.emotionalVector!.altitudeTo, 'satisfied')

  // Provenance should track daily_checkin
  assert.equal(result.prefilledSources.get('emotionalVector')?.kind, 'daily_checkin')
  assert.equal(result.prefilledSources.get('channel')?.kind, 'daily_checkin')

  console.log('✓ daily check-in pre-fills emotional vector and skips step')
}

// ---------------------------------------------------------------------------
// Daily check-in altitude resolution (dissatisfied → neutral)
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: {
      id: 'checkin-002',
      channel: 'fear',
      altitude: 'dissatisfied',
    },
  })

  // Target altitude should be one step up: dissatisfied → neutral
  assert.equal(result.resolvedBag.emotionalVector!.altitudeFrom, 'dissatisfied')
  assert.equal(result.resolvedBag.emotionalVector!.altitudeTo, 'neutral')
  assert.equal(result.resolvedBag.emotionalVector!.channelFrom, 'Fear')

  console.log('✓ altitude resolution: dissatisfied → neutral')
}

// ---------------------------------------------------------------------------
// Spoke draw pre-locks face → skips face_selection
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    spokeFace: 'regent',
  })

  const skippedIds = result.skippedSteps.map((s) => s.id)
  assert.ok(skippedIds.includes('face_selection'), 'face_selection should be skipped')

  assert.equal(result.resolvedBag.lockedFace, 'regent')
  assert.equal(result.prefilledSources.get('lockedFace')?.kind, 'spoke_draw')

  // First active step should be emotional_checkin (face is pre-filled but emotion isn't)
  assert.equal(result.firstActiveStep?.id, 'emotional_checkin')

  console.log('✓ spoke draw pre-locks face and skips face_selection')
}

// ---------------------------------------------------------------------------
// CTA face overrides spoke draw face
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    spokeFace: 'regent',
    ctaFace: 'sage',
  })

  // CTA wins over spoke draw
  assert.equal(result.resolvedBag.lockedFace, 'sage')
  assert.equal(result.prefilledSources.get('lockedFace')?.kind, 'cta')

  console.log('✓ CTA face overrides spoke draw face')
}

// ---------------------------------------------------------------------------
// Both check-in and spoke draw → skips emotional_checkin AND face_selection
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: {
      id: 'checkin-003',
      channel: 'anger',
      altitude: 'neutral',
    },
    spokeFace: 'challenger',
  })

  const skippedIds = result.skippedSteps.map((s) => s.id)
  assert.ok(skippedIds.includes('emotional_checkin'))
  assert.ok(skippedIds.includes('face_selection'))

  // 3 active steps: narrative_template, charge_text, confirmation
  assert.equal(result.activeSteps.length, 3)
  assert.equal(result.firstActiveStep?.id, 'narrative_template')

  console.log('✓ check-in + spoke draw skips both emotional_checkin and face_selection')
}

// ---------------------------------------------------------------------------
// Checkpoint data restores partial state
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    checkpointData: {
      lockedFace: 'architect',
      chargeText: 'I want to build something meaningful',
    },
  })

  // face_selection and charge_text should be skipped
  const skippedIds = result.skippedSteps.map((s) => s.id)
  assert.ok(skippedIds.includes('face_selection'))
  assert.ok(skippedIds.includes('charge_text'))

  assert.equal(result.resolvedBag.lockedFace, 'architect')
  assert.equal(result.resolvedBag.chargeText, 'I want to build something meaningful')
  assert.equal(result.prefilledSources.get('lockedFace')?.kind, 'checkpoint')
  assert.equal(result.prefilledSources.get('chargeText')?.kind, 'checkpoint')

  console.log('✓ checkpoint data restores partial state and skips completed steps')
}

// ---------------------------------------------------------------------------
// CTA overrides checkpoint face (priority layering)
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    checkpointData: {
      lockedFace: 'architect',
    },
    ctaFace: 'diplomat',
  })

  // CTA wins over checkpoint
  assert.equal(result.resolvedBag.lockedFace, 'diplomat')
  assert.equal(result.prefilledSources.get('lockedFace')?.kind, 'cta')

  console.log('✓ CTA overrides checkpoint face')
}

// ---------------------------------------------------------------------------
// Check-in overrides checkpoint emotional data
// ---------------------------------------------------------------------------

{
  const ev: EmotionalVector = {
    channelFrom: 'Sadness',
    altitudeFrom: 'dissatisfied',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  }
  const result = resolveAdaptiveSteps({
    checkpointData: {
      emotionalVector: ev,
      channel: 'Sadness',
      altitude: 'dissatisfied',
    },
    dailyCheckIn: {
      id: 'checkin-004',
      channel: 'joy',
      altitude: 'neutral',
    },
  })

  // Daily check-in wins over checkpoint
  assert.equal(result.resolvedBag.channel, 'Joy')
  assert.equal(result.resolvedBag.altitude, 'neutral')
  assert.equal(result.resolvedBag.emotionalVector!.channelFrom, 'Joy')
  assert.equal(result.prefilledSources.get('channel')?.kind, 'daily_checkin')

  console.log('✓ daily check-in overrides checkpoint emotional data')
}

// ---------------------------------------------------------------------------
// GM step overrides reorder steps
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    stepOverrides: {
      face_selection: 5,   // Move face before emotional_checkin
      emotional_checkin: 15, // Move emotional_checkin after face
    },
  })

  // Face should come before emotional_checkin
  const faceIdx = result.steps.findIndex((s) => s.id === 'face_selection')
  const emotionIdx = result.steps.findIndex((s) => s.id === 'emotional_checkin')
  assert.ok(faceIdx < emotionIdx, 'face_selection should be ordered before emotional_checkin')

  // Effective priorities should reflect overrides
  const face = result.steps.find((s) => s.id === 'face_selection')!
  assert.equal(face.effectivePriority, 5)

  console.log('✓ GM step overrides reorder steps correctly')
}

// ---------------------------------------------------------------------------
// Invalid daily check-in data is ignored
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: {
      id: 'checkin-bad',
      channel: 'invalid_channel',
      altitude: 'dissatisfied',
    },
  })

  // Should not pre-fill anything from invalid check-in
  assert.equal(result.resolvedBag.emotionalVector, undefined)
  assert.equal(result.resolvedBag.channel, undefined)
  assert.equal(result.activeSteps.length, 5) // all steps active

  console.log('✓ invalid check-in data is ignored gracefully')
}

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: {
      id: 'checkin-bad2',
      channel: 'joy',
      altitude: 'invalid_altitude',
    },
  })

  assert.equal(result.resolvedBag.emotionalVector, undefined)
  assert.equal(result.activeSteps.length, 5)

  console.log('✓ invalid altitude in check-in is ignored')
}

// ---------------------------------------------------------------------------
// Dependency validation
// ---------------------------------------------------------------------------

{
  const resolution = resolveAdaptiveSteps(emptyContext())

  // Confirmation step requires emotionalVector, lockedFace, narrativeTemplateId, chargeText
  const confirmStep = resolution.steps.find((s) => s.id === 'confirmation')!
  const missing = validateStepDependencies(confirmStep, {})
  assert.deepStrictEqual(missing, ['emotionalVector', 'lockedFace', 'narrativeTemplateId', 'chargeText'])

  assert.equal(canEnterStep(confirmStep, {}), false)

  // With all fields present
  const fullBag: ComposerDataBag = {
    emotionalVector: {
      channelFrom: 'Joy',
      altitudeFrom: 'satisfied',
      channelTo: 'Joy',
      altitudeTo: 'satisfied',
    },
    lockedFace: 'sage',
    narrativeTemplateId: 'tpl-1',
    chargeText: 'test',
  }
  assert.equal(canEnterStep(confirmStep, fullBag), true)
  assert.deepStrictEqual(validateStepDependencies(confirmStep, fullBag), [])

  console.log('✓ dependency validation works correctly')
}

// ---------------------------------------------------------------------------
// Step navigation helpers
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    spokeFace: 'shaman', // skips face_selection
  })

  // getActiveStepAtIndex
  const first = getActiveStepAtIndex(result, 0)
  assert.equal(first?.id, 'emotional_checkin')

  const outOfBounds = getActiveStepAtIndex(result, 99)
  assert.equal(outOfBounds, null)

  const negative = getActiveStepAtIndex(result, -1)
  assert.equal(negative, null)

  // getActiveStepIndex
  assert.equal(getActiveStepIndex(result, 'emotional_checkin'), 0)
  assert.equal(getActiveStepIndex(result, 'face_selection'), -1) // skipped
  assert.equal(getActiveStepIndex(result, 'narrative_template'), 1)

  console.log('✓ step navigation helpers work correctly')
}

// ---------------------------------------------------------------------------
// advanceAndResolve — step completion re-evaluates skipConditions
// ---------------------------------------------------------------------------

{
  const ctx: PlayerComposerContext = {}
  const initial = resolveAdaptiveSteps(ctx)

  // All 5 steps active initially
  assert.equal(initial.activeSteps.length, 5)

  // Player completes emotional check-in
  const afterEmotion = advanceAndResolve(
    initial.resolvedBag,
    {
      emotionalVector: {
        channelFrom: 'Fear',
        altitudeFrom: 'dissatisfied',
        channelTo: 'Fear',
        altitudeTo: 'neutral',
      },
      channel: 'Fear',
      altitude: 'dissatisfied',
    },
    ctx,
  )

  // emotional_checkin should now be skipped
  const skippedIds = afterEmotion.skippedSteps.map((s) => s.id)
  assert.ok(skippedIds.includes('emotional_checkin'))
  assert.equal(afterEmotion.activeSteps.length, 4)
  assert.equal(afterEmotion.firstActiveStep?.id, 'face_selection')

  // Player completes face selection
  const afterFace = advanceAndResolve(
    afterEmotion.resolvedBag,
    { lockedFace: 'diplomat' },
    ctx,
  )

  assert.equal(afterFace.activeSteps.length, 3)
  assert.equal(afterFace.firstActiveStep?.id, 'narrative_template')

  // Player completes narrative template + charge text
  const afterAll = advanceAndResolve(
    afterFace.resolvedBag,
    { narrativeTemplateId: 'tpl-42', chargeText: 'My intention' },
    ctx,
  )

  // Only confirmation remains
  assert.equal(afterAll.activeSteps.length, 1)
  assert.equal(afterAll.firstActiveStep?.id, 'confirmation')
  assert.equal(afterAll.isReadyForConfirmation, true)

  console.log('✓ advanceAndResolve re-evaluates skipConditions on each advancement')
}

// ---------------------------------------------------------------------------
// buildStateToBag — bridge from CyoaBuildState Choice fields
// ---------------------------------------------------------------------------

{
  // Unlocked empty state
  const bag1 = buildStateToBag({
    face: { status: 'unlocked', value: null },
    emotionalVector: { status: 'unlocked', value: null },
    narrativeTemplate: null,
    extras: {},
  })
  assert.deepStrictEqual(bag1, {})

  // Locked face + emotional vector
  const ev: EmotionalVector = {
    channelFrom: 'Anger',
    altitudeFrom: 'neutral',
    channelTo: 'Joy',
    altitudeTo: 'satisfied',
  }
  const bag2 = buildStateToBag({
    face: { status: 'locked', value: 'regent' as GameMasterFace },
    emotionalVector: { status: 'locked', value: ev },
    narrativeTemplate: { templateId: 'tpl-7', templateKind: 'quest' },
    extras: { chargeText: 'Build the bridge', dailyCheckInId: 'ci-99' },
  })

  assert.equal(bag2.lockedFace, 'regent')
  assert.deepStrictEqual(bag2.emotionalVector, ev)
  assert.equal(bag2.channel, 'Anger')
  assert.equal(bag2.altitude, 'neutral')
  assert.equal(bag2.narrativeTemplateId, 'tpl-7')
  assert.equal(bag2.chargeText, 'Build the bridge')
  assert.equal(bag2.dailyCheckInId, 'ci-99')

  console.log('✓ buildStateToBag extracts data from CyoaBuildState Choice fields')
}

// ---------------------------------------------------------------------------
// isReadyForConfirmation when all data is pre-filled
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: { id: 'ci-full', channel: 'joy', altitude: 'satisfied' },
    ctaFace: 'sage',
    checkpointData: {
      narrativeTemplateId: 'tpl-pre',
      chargeText: 'Everything is pre-filled',
    },
  })

  // Only confirmation should remain
  assert.equal(result.isReadyForConfirmation, true)
  assert.equal(result.firstActiveStep?.id, 'confirmation')

  // 4 steps skipped, 1 active (confirmation)
  assert.equal(result.skippedSteps.length, 4)
  assert.equal(result.activeSteps.length, 1)

  console.log('✓ isReadyForConfirmation when all data is pre-filled')
}

// ---------------------------------------------------------------------------
// Null check-in and null spoke face are handled
// ---------------------------------------------------------------------------

{
  const result = resolveAdaptiveSteps({
    dailyCheckIn: null,
    spokeFace: null,
    ctaFace: null,
    checkpointData: null,
    stepOverrides: null,
  })

  // Should be identical to empty context
  assert.equal(result.activeSteps.length, 5)
  assert.equal(result.skippedSteps.length, 0)

  console.log('✓ null values handled gracefully')
}

console.log('\n✓ All adaptive-resolver tests passed')
