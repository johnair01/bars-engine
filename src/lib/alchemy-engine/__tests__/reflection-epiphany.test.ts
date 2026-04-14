/**
 * AC 7: Completing Reflection enables epiphany state (regulation = satisfied)
 *
 * Proves the core invariant: the Reflection BAR IS the epiphany artifact,
 * and completing the Reflection phase transitions regulation to 'satisfied'.
 *
 * Tests cover:
 *   1. Reflection completion transitions regulation from neutral → satisfied
 *   2. Arc is marked complete (toPhase = null, arcComplete = true)
 *   3. The Reflection BAR carries isEpiphany: true in strandMetadata
 *   4. The Reflection BAR is channel-typed to the stabilized emotional channel
 *   5. Phase-lock prevents reaching epiphany out-of-order
 *   6. No separate Epiphany model — the BAR IS the epiphany
 *   7. Full arc proves dissatisfied → neutral → satisfied trajectory
 *   8. hasCompletedPhase('satisfied', 'reflection') returns true
 *   9. describeArcProgress reports epiphany achieved after arc completion
 *
 * Run: npx tsx src/lib/alchemy-engine/__tests__/reflection-epiphany.test.ts
 */

import assert from 'node:assert/strict'

import {
  validateReflectionPhaseCompletion,
  computeTransition,
  hasCompletedPhase,
  describeArcProgress,
  computeArcTrajectory,
} from '../phase-advancement'

import {
  type ArcPhase,
  type RegulationState,
  PHASE_REGULATION_MAP,
  VERTICAL_SLICE,
  canAdvancePhase,
  regulationAfterPhase,
  nextPhase,
} from '../types'

import {
  buildReflectionBarData,
  type ReflectionBarMetadata,
} from '../bar-production'

// ═══════════════════════════════════════════════════════════════════════════
// 1. Reflection completion: neutral → satisfied (epiphany state)
// ═══════════════════════════════════════════════════════════════════════════

{
  // The PHASE_REGULATION_MAP defines the contract
  assert.strictEqual(PHASE_REGULATION_MAP.reflection.from, 'neutral',
    'Reflection requires neutral regulation (prerequisite)')
  assert.strictEqual(PHASE_REGULATION_MAP.reflection.to, 'satisfied',
    'Reflection completes to satisfied (epiphany)')

  // regulationAfterPhase confirms the same
  assert.strictEqual(regulationAfterPhase('reflection'), 'satisfied',
    'regulationAfterPhase(reflection) = satisfied')

  // computeTransition produces the correct transition
  const transition = computeTransition('reflection', 'neutral')
  assert.strictEqual(transition.fromRegulation, 'neutral')
  assert.strictEqual(transition.toRegulation, 'satisfied',
    'Reflection transition: neutral → satisfied')
  assert.strictEqual(transition.arcComplete, true,
    'Reflection completion marks arc as complete')
  assert.strictEqual(transition.toPhase, null,
    'No phase after reflection (arc done)')
}

console.log('✅ 1. Reflection completion: neutral → satisfied')

// ═══════════════════════════════════════════════════════════════════════════
// 2. Arc complete state: toPhase is null, arcComplete is true
// ═══════════════════════════════════════════════════════════════════════════

{
  assert.strictEqual(nextPhase('reflection'), null,
    'nextPhase(reflection) = null (no more phases)')

  const transition = computeTransition('reflection', 'neutral')
  assert.strictEqual(transition.toPhase, null)
  assert.strictEqual(transition.arcComplete, true)
  assert.ok(transition.timestamp instanceof Date)
}

console.log('✅ 2. Arc complete state: toPhase=null, arcComplete=true')

// ═══════════════════════════════════════════════════════════════════════════
// 3. Reflection BAR carries isEpiphany: true (BAR IS the epiphany)
// ═══════════════════════════════════════════════════════════════════════════

{
  const barData = buildReflectionBarData({
    playerId: 'test-player-id',
    channel: 'Anger',
    content: 'I realized my anger was protecting a boundary I had been ignoring.',
    waveMove: 'wakeUp',
    face: 'challenger',
    intakeBarId: 'intake-bar-123',
    actionBarId: 'action-bar-456',
  })

  const metadata: ReflectionBarMetadata = JSON.parse(barData.strandMetadata)

  // The key invariant: isEpiphany is true
  assert.strictEqual(metadata.isEpiphany, true,
    'Reflection BAR strandMetadata.isEpiphany must be true')
  assert.strictEqual(metadata.alchemyEngine, true,
    'Must be tagged as alchemyEngine')
  assert.strictEqual(metadata.arcPhase, 'reflection',
    'arcPhase must be reflection')

  // Regulation transition recorded in the BAR metadata
  assert.strictEqual(metadata.regulation.from, 'neutral',
    'BAR records regulation.from = neutral')
  assert.strictEqual(metadata.regulation.to, 'satisfied',
    'BAR records regulation.to = satisfied')

  // Provenance chain
  assert.strictEqual(metadata.intakeBarId, 'intake-bar-123')
  assert.strictEqual(metadata.actionBarId, 'action-bar-456')
}

console.log('✅ 3. Reflection BAR carries isEpiphany: true')

// ═══════════════════════════════════════════════════════════════════════════
// 4. Reflection BAR is channel-typed to the emotional channel
// ═══════════════════════════════════════════════════════════════════════════

{
  const channels = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const
  const expectedDbChannels: Record<string, string> = {
    Fear: 'fear', Anger: 'anger', Sadness: 'sadness', Joy: 'joy', Neutrality: 'neutrality',
  }

  for (const channel of channels) {
    const barData = buildReflectionBarData({
      playerId: 'test-player-id',
      channel,
      content: `Reflection for ${channel}`,
    })

    assert.strictEqual(barData.nation, expectedDbChannels[channel],
      `nation should be '${expectedDbChannels[channel]}' for ${channel}`)
    assert.strictEqual(barData.emotionalAlchemyTag, expectedDbChannels[channel],
      `emotionalAlchemyTag should match nation for ${channel}`)

    const metadata: ReflectionBarMetadata = JSON.parse(barData.strandMetadata)
    assert.strictEqual(metadata.channel, channel,
      `strandMetadata.channel should be '${channel}'`)
    assert.strictEqual(metadata.isEpiphany, true,
      `isEpiphany must be true for all channels`)
  }
}

console.log('✅ 4. Reflection BAR is channel-typed to emotional channel')

// ═══════════════════════════════════════════════════════════════════════════
// 5. Phase-lock prevents reaching epiphany out of order
// ═══════════════════════════════════════════════════════════════════════════

{
  // Cannot reach satisfied from dissatisfied (skipping intake + action)
  assert.strictEqual(
    canAdvancePhase('reflection', 'dissatisfied'), false,
    'Cannot reach epiphany from dissatisfied (must pass through intake first)')

  // Cannot reach satisfied from satisfied (already done)
  assert.strictEqual(
    canAdvancePhase('reflection', 'satisfied'), false,
    'Cannot re-achieve epiphany when already satisfied')

  // Validation provides clear error messages
  const fromDissatisfied = validateReflectionPhaseCompletion('reflection', 'dissatisfied')
  assert.strictEqual(fromDissatisfied.valid, false)
  assert.ok(fromDissatisfied.reason?.includes("requires regulation 'neutral'"))

  const fromSatisfied = validateReflectionPhaseCompletion('reflection', 'satisfied')
  assert.strictEqual(fromSatisfied.valid, false)

  // Cannot reach reflection phase without completing action (wrong phase)
  const wrongPhase = validateReflectionPhaseCompletion('action', 'neutral')
  assert.strictEqual(wrongPhase.valid, false)
  assert.ok(wrongPhase.reason?.includes("current phase is 'action'"))
}

console.log('✅ 5. Phase-lock prevents out-of-order epiphany')

// ═══════════════════════════════════════════════════════════════════════════
// 6. No separate Epiphany model — the BAR IS the epiphany
// ═══════════════════════════════════════════════════════════════════════════

{
  // The BAR type is 'reflection', not 'epiphany'
  const barData = buildReflectionBarData({
    playerId: 'test-player-id',
    channel: 'Fear',
    content: 'My fear was trying to keep me safe from vulnerability.',
  })

  assert.strictEqual(barData.type, 'reflection',
    'BAR type is reflection (not a separate epiphany type)')
  assert.strictEqual(barData.status, 'seed',
    'BAR starts as seed status')

  // The epiphany identity is encoded in metadata, not as a separate model
  const metadata: ReflectionBarMetadata = JSON.parse(barData.strandMetadata)
  assert.strictEqual(metadata.isEpiphany, true,
    'Epiphany identity in metadata, not separate model')
  assert.strictEqual(metadata.arcPhase, 'reflection',
    'Phase is reflection, not epiphany')
}

console.log('✅ 6. No separate Epiphany model — BAR IS the epiphany')

// ═══════════════════════════════════════════════════════════════════════════
// 7. Full arc trajectory: dissatisfied → neutral → satisfied
// ═══════════════════════════════════════════════════════════════════════════

{
  // Walk the entire arc via pure functions
  let regulation: RegulationState = VERTICAL_SLICE.initialRegulation
  let phase: ArcPhase | null = 'intake'

  // Intake: dissatisfied → neutral
  assert.strictEqual(regulation, 'dissatisfied')
  const t1 = computeTransition(phase!, regulation)
  regulation = t1.toRegulation
  phase = t1.toPhase
  assert.strictEqual(regulation, 'neutral')
  assert.strictEqual(phase, 'action')

  // Action: neutral → neutral (capacity building)
  const t2 = computeTransition(phase!, regulation)
  regulation = t2.toRegulation
  phase = t2.toPhase
  assert.strictEqual(regulation, 'neutral', 'Action keeps neutral')
  assert.strictEqual(phase, 'reflection')

  // Reflection: neutral → satisfied (EPIPHANY)
  const t3 = computeTransition(phase!, regulation)
  regulation = t3.toRegulation
  phase = t3.toPhase
  assert.strictEqual(regulation, 'satisfied',
    'Reflection enables epiphany state (satisfied)')
  assert.strictEqual(phase, null, 'Arc is complete')
  assert.strictEqual(t3.arcComplete, true, 'arcComplete flag is set')

  // The trajectory matches the PHASE_REGULATION_MAP
  const trajectory = computeArcTrajectory()
  assert.deepStrictEqual(trajectory.reflection, { from: 'neutral', to: 'satisfied' })
}

console.log('✅ 7. Full arc: dissatisfied → neutral → satisfied')

// ═══════════════════════════════════════════════════════════════════════════
// 8. hasCompletedPhase proves reflection done when satisfied
// ═══════════════════════════════════════════════════════════════════════════

{
  // Only 'satisfied' proves reflection is complete
  assert.strictEqual(hasCompletedPhase('satisfied', 'reflection'), true,
    'satisfied proves reflection complete')
  assert.strictEqual(hasCompletedPhase('neutral', 'reflection'), false,
    'neutral does NOT prove reflection complete')
  assert.strictEqual(hasCompletedPhase('dissatisfied', 'reflection'), false,
    'dissatisfied does NOT prove reflection complete')

  // satisfied also proves all earlier phases complete
  assert.strictEqual(hasCompletedPhase('satisfied', 'intake'), true)
  assert.strictEqual(hasCompletedPhase('satisfied', 'action'), true)
}

console.log('✅ 8. hasCompletedPhase confirms epiphany from satisfied')

// ═══════════════════════════════════════════════════════════════════════════
// 9. describeArcProgress reports epiphany after arc completion
// ═══════════════════════════════════════════════════════════════════════════

{
  const description = describeArcProgress(null, 'satisfied')
  assert.ok(description.includes('Arc complete'), 'should say arc complete')
  assert.ok(
    description.toLowerCase().includes('epiphany'),
    'should mention epiphany in completed arc description',
  )
  assert.ok(description.includes('satisfied'), 'should mention satisfied')

  // During reflection phase (before completion)
  const duringReflection = describeArcProgress('reflection', 'neutral')
  assert.ok(duringReflection.includes('Reflection'), 'should describe reflection phase')
  assert.ok(
    duringReflection.toLowerCase().includes('epiphany') ||
    duringReflection.includes('neutral'),
    'should show current regulation state or mention epiphany goal',
  )
}

console.log('✅ 9. describeArcProgress reports epiphany after completion')

// ═══════════════════════════════════════════════════════════════════════════
// 10. Reflection BAR title defaults to epiphany naming
// ═══════════════════════════════════════════════════════════════════════════

{
  // Without custom title, the BAR gets an epiphany-styled default title
  const barData = buildReflectionBarData({
    playerId: 'test-player-id',
    channel: 'Sadness',
    content: 'What I was grieving was a version of myself I had outgrown.',
  })

  assert.ok(barData.title.includes('Epiphany'),
    `Default title should include "Epiphany", got: "${barData.title}"`)
  assert.ok(barData.title.includes('Sadness'),
    `Default title should include channel name, got: "${barData.title}"`)

  // With custom title, it's respected
  const customBarData = buildReflectionBarData({
    playerId: 'test-player-id',
    channel: 'Joy',
    content: 'The delight was always there underneath.',
    title: 'My Wake Up Moment',
  })

  assert.strictEqual(customBarData.title, 'My Wake Up Moment',
    'Custom title should be used when provided')
}

console.log('✅ 10. Reflection BAR title defaults to epiphany naming')

// ═══════════════════════════════════════════════════════════════════════════
// 11. Vertical slice: Challenger + Wake Up defaults on Reflection BAR
// ═══════════════════════════════════════════════════════════════════════════

{
  // Without explicit face/waveMove, defaults to vertical slice values
  const barData = buildReflectionBarData({
    playerId: 'test-player-id',
    channel: 'Anger',
    content: 'I see it now.',
  })

  assert.strictEqual(barData.moveType, 'wakeUp',
    'Default WAVE move is wakeUp')
  assert.strictEqual(barData.gameMasterFace, 'challenger',
    'Default GM face is challenger')

  const metadata: ReflectionBarMetadata = JSON.parse(barData.strandMetadata)
  assert.strictEqual(metadata.waveMove, 'wakeUp')
  assert.strictEqual(metadata.face, 'challenger')
}

console.log('✅ 11. Vertical slice defaults on Reflection BAR')

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log('')
console.log('═══════════════════════════════════════════════════════════════')
console.log('✅ AC 7: Completing Reflection enables epiphany state — ALL PASSED')
console.log('  1.  Reflection completion: neutral → satisfied')
console.log('  2.  Arc complete state: toPhase=null, arcComplete=true')
console.log('  3.  Reflection BAR carries isEpiphany: true')
console.log('  4.  Reflection BAR is channel-typed to emotional channel')
console.log('  5.  Phase-lock prevents out-of-order epiphany')
console.log('  6.  No separate Epiphany model — BAR IS the epiphany')
console.log('  7.  Full arc: dissatisfied → neutral → satisfied')
console.log('  8.  hasCompletedPhase confirms epiphany from satisfied')
console.log('  9.  describeArcProgress reports epiphany after completion')
console.log('  10. Reflection BAR title defaults to epiphany naming')
console.log('  11. Vertical slice defaults on Reflection BAR')
console.log('═══════════════════════════════════════════════════════════════')
