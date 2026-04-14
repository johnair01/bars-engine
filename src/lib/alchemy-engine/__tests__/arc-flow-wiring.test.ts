/**
 * Alchemy Engine — Arc Flow Wiring Tests
 *
 * Validates that the Action phase is correctly wired into the 3-phase
 * CYOA arc flow:
 *   1. Action receives Intake output (phase-locked: requires neutral regulation)
 *   2. Action produces a channel-typed BAR with Challenger move metadata
 *   3. Action BAR result flows to Reflection phase (phase advances to reflection)
 *
 * These are pure logic tests — no DB, no React rendering.
 * They validate the data flow contracts between phases.
 */

import { describe, test, expect } from 'vitest'
import {
  PHASE_REGULATION_MAP,
  VERTICAL_SLICE,
  CHALLENGER_MOVE_META,
  isChallengerMoveId,
  canAdvancePhase,
  regulationAfterPhase,
  nextPhase,
  type ArcPhase,
  type RegulationState,
} from '../types'
import {
  validateIntakePhaseCompletion,
  validateActionPhaseCompletion,
  validateReflectionPhaseCompletion,
  computeTransition,
} from '../phase-advancement'
import {
  buildIntakeBarData,
  buildActionBarData,
  buildReflectionBarData,
  type BarCreateData,
} from '../bar-production'
import type { EmotionalChannel } from '@/lib/quest-grammar/types'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TEST_PLAYER_ID = 'test-player-123'
const TEST_CHANNEL: EmotionalChannel = 'Anger'

// ---------------------------------------------------------------------------
// Phase-locked wiring: Intake → Action
// ---------------------------------------------------------------------------

describe('Intake → Action wiring', () => {
  test('Intake completion produces correct regulation for Action prerequisite', () => {
    // Intake requires dissatisfied, produces neutral
    const intakeFrom = PHASE_REGULATION_MAP.intake.from
    const intakeTo = PHASE_REGULATION_MAP.intake.to
    expect(intakeFrom).toBe('dissatisfied')
    expect(intakeTo).toBe('neutral')

    // Action requires neutral — exactly what Intake produces
    const actionFrom = PHASE_REGULATION_MAP.action.from
    expect(actionFrom).toBe('neutral')
    expect(intakeTo).toBe(actionFrom)
  })

  test('Intake phase completion advances to action phase', () => {
    const next = nextPhase('intake')
    expect(next).toBe('action')
  })

  test('Intake completion transition produces correct state for Action', () => {
    const transition = computeTransition('intake', 'dissatisfied')
    expect(transition.toPhase).toBe('action')
    expect(transition.toRegulation).toBe('neutral')
    expect(transition.arcComplete).toBe(false)
  })

  test('Action validation passes with Intake output state (neutral)', () => {
    const validation = validateActionPhaseCompletion('action', 'neutral')
    expect(validation.valid).toBe(true)
  })

  test('Action validation fails if Intake not completed (still dissatisfied)', () => {
    const validation = validateActionPhaseCompletion('intake', 'dissatisfied')
    expect(validation.valid).toBe(false)
    expect(validation.reason).toContain('intake')
  })

  test('Intake BAR carries channel typing that Action can inherit', () => {
    const intakeBar = buildIntakeBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'Test intake content',
    })

    // The channel is encoded in the BAR for downstream access
    expect(intakeBar.nation).toBe('anger')
    expect(intakeBar.emotionalAlchemyTag).toBe('anger')
    expect(intakeBar.type).toBe('intake')

    // Metadata carries full provenance
    const meta = JSON.parse(intakeBar.strandMetadata)
    expect(meta.alchemyEngine).toBe(true)
    expect(meta.arcPhase).toBe('intake')
    expect(meta.channel).toBe('Anger')
  })
})

// ---------------------------------------------------------------------------
// Action → Reflection wiring
// ---------------------------------------------------------------------------

describe('Action → Reflection wiring', () => {
  test('Action completion produces correct regulation for Reflection prerequisite', () => {
    // Action requires neutral, produces neutral (capacity building)
    const actionFrom = PHASE_REGULATION_MAP.action.from
    const actionTo = PHASE_REGULATION_MAP.action.to
    expect(actionFrom).toBe('neutral')
    expect(actionTo).toBe('neutral')

    // Reflection requires neutral — matches what Action produces
    const reflectionFrom = PHASE_REGULATION_MAP.reflection.from
    expect(reflectionFrom).toBe('neutral')
    expect(actionTo).toBe(reflectionFrom)
  })

  test('Action phase completion advances to reflection phase', () => {
    const next = nextPhase('action')
    expect(next).toBe('reflection')
  })

  test('Action completion transition produces correct state for Reflection', () => {
    const transition = computeTransition('action', 'neutral')
    expect(transition.toPhase).toBe('reflection')
    expect(transition.toRegulation).toBe('neutral')
    expect(transition.arcComplete).toBe(false)
  })

  test('Reflection validation passes with Action output state (neutral)', () => {
    const validation = validateReflectionPhaseCompletion('reflection', 'neutral')
    expect(validation.valid).toBe(true)
  })

  test('Reflection validation fails if Action not completed (still in action phase)', () => {
    const validation = validateReflectionPhaseCompletion('action', 'neutral')
    expect(validation.valid).toBe(false)
  })

  test('Action BAR carries Challenger move metadata for Reflection aggregation', () => {
    const actionBar = buildActionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      moveId: 'issue_challenge',
      response: 'I challenge myself to face my anger directly.',
    })

    // BAR is typed to the same channel as Intake
    expect(actionBar.nation).toBe('anger')
    expect(actionBar.emotionalAlchemyTag).toBe('anger')
    expect(actionBar.type).toBe('action')

    // Metadata carries Challenger move details that Reflection can read
    const meta = JSON.parse(actionBar.strandMetadata)
    expect(meta.alchemyEngine).toBe(true)
    expect(meta.arcPhase).toBe('action')
    expect(meta.challengerMoveId).toBe('issue_challenge')
    expect(meta.challengerMove).toBeDefined()
    expect(meta.challengerMove.canonicalMoveId).toBe('fire_transcend')
    expect(meta.challengerMove.title).toBe('Issue Challenge')
    expect(meta.challengerMove.energyDelta).toBe(2)
  })

  test('Action BAR channel matches Intake BAR channel (consistent typing)', () => {
    const intakeBar = buildIntakeBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'Intake content',
    })

    const actionBar = buildActionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      moveId: 'propose_move',
      response: 'I declare my intention.',
    })

    expect(intakeBar.nation).toBe(actionBar.nation)
    expect(intakeBar.emotionalAlchemyTag).toBe(actionBar.emotionalAlchemyTag)
    expect(intakeBar.gameMasterFace).toBe(actionBar.gameMasterFace)
    expect(intakeBar.moveType).toBe(actionBar.moveType)
  })
})

// ---------------------------------------------------------------------------
// Full arc flow: Intake → Action → Reflection
// ---------------------------------------------------------------------------

describe('Full 3-phase arc flow wiring', () => {
  test('phases advance in correct order with correct regulation', () => {
    // Simulate the full arc flow
    let phase: ArcPhase = 'intake'
    let regulation: RegulationState = 'dissatisfied'

    // Phase 1: Intake completion
    expect(canAdvancePhase(phase, regulation)).toBe(true)
    const t1 = computeTransition(phase, regulation)
    phase = t1.toPhase as ArcPhase
    regulation = t1.toRegulation
    expect(phase).toBe('action')
    expect(regulation).toBe('neutral')
    expect(t1.arcComplete).toBe(false)

    // Phase 2: Action completion
    expect(canAdvancePhase(phase, regulation)).toBe(true)
    const t2 = computeTransition(phase, regulation)
    phase = t2.toPhase as ArcPhase
    regulation = t2.toRegulation
    expect(phase).toBe('reflection')
    expect(regulation).toBe('neutral')
    expect(t2.arcComplete).toBe(false)

    // Phase 3: Reflection completion
    expect(canAdvancePhase(phase, regulation)).toBe(true)
    const t3 = computeTransition(phase, regulation)
    expect(t3.toPhase).toBeNull() // arc complete
    expect(t3.toRegulation).toBe('satisfied')
    expect(t3.arcComplete).toBe(true)
  })

  test('3 BARs produced have correct phase types and consistent channel', () => {
    const intakeBar = buildIntakeBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'Named dissatisfaction',
    })

    const actionBar = buildActionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      moveId: 'issue_challenge',
      response: 'Committed to action',
    })

    const reflectionBar = buildReflectionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'Epiphany insight',
      intakeBarId: 'intake-bar-id',
      actionBarId: 'action-bar-id',
    })

    // Phase types are distinct
    expect(intakeBar.type).toBe('intake')
    expect(actionBar.type).toBe('action')
    expect(reflectionBar.type).toBe('reflection')

    // All share same channel typing
    expect(intakeBar.nation).toBe('anger')
    expect(actionBar.nation).toBe('anger')
    expect(reflectionBar.nation).toBe('anger')

    // All share same WAVE move and face (vertical slice)
    expect(intakeBar.moveType).toBe('wakeUp')
    expect(actionBar.moveType).toBe('wakeUp')
    expect(reflectionBar.moveType).toBe('wakeUp')

    expect(intakeBar.gameMasterFace).toBe('challenger')
    expect(actionBar.gameMasterFace).toBe('challenger')
    expect(reflectionBar.gameMasterFace).toBe('challenger')
  })

  test('Reflection BAR carries provenance to Intake + Action BARs', () => {
    const reflectionBar = buildReflectionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'My epiphany',
      intakeBarId: 'intake-123',
      actionBarId: 'action-456',
    })

    const meta = JSON.parse(reflectionBar.strandMetadata)
    expect(meta.isEpiphany).toBe(true)
    expect(meta.intakeBarId).toBe('intake-123')
    expect(meta.actionBarId).toBe('action-456')
    expect(meta.arcPhase).toBe('reflection')
  })

  test('Reflection BAR IS the epiphany — no separate model', () => {
    const reflectionBar = buildReflectionBarData({
      playerId: TEST_PLAYER_ID,
      channel: TEST_CHANNEL,
      content: 'The boundary was the breakthrough',
    })

    const meta = JSON.parse(reflectionBar.strandMetadata)
    expect(meta.isEpiphany).toBe(true)
    expect(meta.alchemyEngine).toBe(true)
    // The BAR itself is the artifact — no reference to external model
    expect(meta.epiphanyModelId).toBeUndefined()
  })

  test('both Challenger moves are valid and produce typed Action BARs', () => {
    for (const moveId of ['issue_challenge', 'propose_move'] as const) {
      expect(isChallengerMoveId(moveId)).toBe(true)

      const bar = buildActionBarData({
        playerId: TEST_PLAYER_ID,
        channel: TEST_CHANNEL,
        moveId,
        response: `Response for ${moveId}`,
      })

      expect(bar.type).toBe('action')
      const meta = JSON.parse(bar.strandMetadata)
      expect(meta.challengerMoveId).toBe(moveId)
      expect(meta.challengerMove.moveId).toBe(moveId)
    }
  })

  test('vertical slice defaults are Challenger + Wake Up', () => {
    expect(VERTICAL_SLICE.face).toBe('challenger')
    expect(VERTICAL_SLICE.waveMove).toBe('wakeUp')
    expect(VERTICAL_SLICE.initialRegulation).toBe('dissatisfied')
  })
})

// ---------------------------------------------------------------------------
// Phase-locked guards: cannot skip phases
// ---------------------------------------------------------------------------

describe('Phase-locked guards prevent skipping', () => {
  test('cannot complete Action before Intake', () => {
    // Still at intake phase with dissatisfied regulation
    const validation = validateActionPhaseCompletion('intake', 'dissatisfied')
    expect(validation.valid).toBe(false)
  })

  test('cannot complete Reflection before Action', () => {
    // At action phase — hasn't completed action yet
    const validation = validateReflectionPhaseCompletion('action', 'neutral')
    expect(validation.valid).toBe(false)
  })

  test('cannot complete Reflection before Intake', () => {
    // Still at intake phase
    const validation = validateReflectionPhaseCompletion('intake', 'dissatisfied')
    expect(validation.valid).toBe(false)
  })

  test('regulation cannot jump from dissatisfied to satisfied', () => {
    // At intake, regulation is dissatisfied — cannot advance to reflection
    expect(canAdvancePhase('reflection', 'dissatisfied')).toBe(false)
  })
})
