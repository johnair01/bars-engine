/**
 * Alchemy Engine — Reflection Aggregator Verification
 *
 * Pure logic tests for the data aggregation helper.
 * Tests buildReflectionContextFromData (no DB needed) and deriveEpiphanyTitle.
 *
 * Run: npx tsx src/lib/alchemy-engine/__tests__/reflection-aggregator.verify.ts
 */

import {
  buildReflectionContextFromData,
  deriveEpiphanyTitle,
  type IntakePhaseData,
  type ActionPhaseData,
  type ReflectionContext,
} from '../reflection-aggregator'
import { PHASE_REGULATION_MAP } from '../types'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`  PASS: ${message}`)
}

console.log('=== Alchemy Engine — Reflection Aggregator Verification ===\n')

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const now = new Date()

const mockIntake: IntakePhaseData = {
  barId: 'bar_intake_1',
  title: 'Wake Up — Fear Intake',
  content: 'I am afraid of shipping my creative work publicly.',
  channel: 'fear',
  regulationFrom: 'dissatisfied',
  regulationTo: 'neutral',
  createdAt: now,
}

const mockActionIssueChallenge: ActionPhaseData = {
  barId: 'bar_action_1',
  title: 'Wake Up — Fear Action',
  content: 'I challenge myself to publish one piece of writing this week.',
  moveId: 'issue_challenge',
  moveTitle: 'Issue Challenge',
  canonicalMoveId: 'fire_transcend',
  energyDelta: 2,
  moveNarrative: 'Anger → boundary honored',
  channel: 'fear',
  regulationFrom: 'neutral',
  regulationTo: 'neutral',
  createdAt: now,
}

const mockActionDeclareIntention: ActionPhaseData = {
  barId: 'bar_action_2',
  title: 'Wake Up — Joy Action',
  content: 'I declare my intention to schedule a creative session tomorrow.',
  moveId: 'propose_move',
  moveTitle: 'Declare Intention',
  canonicalMoveId: 'wood_fire',
  energyDelta: 1,
  moveNarrative: 'Momentum into action',
  channel: 'joy',
  regulationFrom: 'neutral',
  regulationTo: 'neutral',
  createdAt: now,
}

// ---------------------------------------------------------------------------
// 1. Basic context construction
// ---------------------------------------------------------------------------
console.log('1. Basic context construction')

const ctx = buildReflectionContextFromData({
  playerId: 'player_1',
  channel: 'Fear',
  intake: mockIntake,
  action: mockActionIssueChallenge,
  arcStartedAt: now,
})

assert(ctx.playerId === 'player_1', 'playerId preserved')
assert(ctx.channel === 'Fear', 'channel preserved')
assert(ctx.face === 'challenger', 'default face is challenger')
assert(ctx.waveMove === 'wakeUp', 'default waveMove is wakeUp')
assert(ctx.currentPhase === 'reflection', 'currentPhase is reflection')
assert(ctx.arcStartedAt === now, 'arcStartedAt preserved')

// ---------------------------------------------------------------------------
// 2. Phase data preservation
// ---------------------------------------------------------------------------
console.log('\n2. Phase data preservation')

assert(ctx.intake.barId === 'bar_intake_1', 'intake barId preserved')
assert(ctx.intake.content.includes('afraid of shipping'), 'intake content preserved')
assert(ctx.intake.regulationFrom === 'dissatisfied', 'intake regulationFrom is dissatisfied')
assert(ctx.intake.regulationTo === 'neutral', 'intake regulationTo is neutral')

assert(ctx.action.barId === 'bar_action_1', 'action barId preserved')
assert(ctx.action.content.includes('publish one piece'), 'action content preserved')
assert(ctx.action.moveId === 'issue_challenge', 'action moveId preserved')
assert(ctx.action.moveTitle === 'Issue Challenge', 'action moveTitle preserved')
assert(ctx.action.energyDelta === 2, 'action energyDelta preserved')
assert(ctx.action.canonicalMoveId === 'fire_transcend', 'action canonicalMoveId preserved')

// ---------------------------------------------------------------------------
// 3. Regulation trajectory
// ---------------------------------------------------------------------------
console.log('\n3. Regulation trajectory')

assert(
  ctx.regulationTrajectory.intake.from === 'dissatisfied' &&
  ctx.regulationTrajectory.intake.to === 'neutral',
  'intake: dissatisfied → neutral',
)

assert(
  ctx.regulationTrajectory.action.from === 'neutral' &&
  ctx.regulationTrajectory.action.to === 'neutral',
  'action: neutral → neutral (capacity building)',
)

assert(
  ctx.regulationTrajectory.reflection.from === 'neutral' &&
  ctx.regulationTrajectory.reflection.to === 'satisfied',
  'reflection: neutral → satisfied (epiphany)',
)

// Verify these match the canonical PHASE_REGULATION_MAP
assert(
  ctx.regulationTrajectory.intake.from === PHASE_REGULATION_MAP.intake.from,
  'intake trajectory matches PHASE_REGULATION_MAP',
)
assert(
  ctx.regulationTrajectory.reflection.to === PHASE_REGULATION_MAP.reflection.to,
  'reflection trajectory matches PHASE_REGULATION_MAP (satisfied = epiphany)',
)

// ---------------------------------------------------------------------------
// 4. Narrative summary (non-AI path)
// ---------------------------------------------------------------------------
console.log('\n4. Narrative summary')

assert(ctx.narrativeSummary.length > 0, 'narrative summary is non-empty')
assert(ctx.narrativeSummary.includes('Fear'), 'narrative includes channel')
assert(ctx.narrativeSummary.includes('challenger'), 'narrative includes face')
assert(ctx.narrativeSummary.includes('Issue Challenge'), 'narrative includes move title')
assert(ctx.narrativeSummary.includes('afraid of shipping'), 'narrative includes intake content')
assert(ctx.narrativeSummary.includes('publish one piece'), 'narrative includes action content')
assert(ctx.narrativeSummary.includes('dissatisfied'), 'narrative includes starting regulation')
assert(ctx.narrativeSummary.includes('reflection'), 'narrative references reflection phase')

// ---------------------------------------------------------------------------
// 5. Reflection prompts
// ---------------------------------------------------------------------------
console.log('\n5. Reflection prompts')

assert(ctx.reflectionPrompts.length === 3, 'exactly 3 reflection prompts')

const namingPrompt = ctx.reflectionPrompts.find(p => p.key === 'naming_impact')
assert(namingPrompt !== undefined, 'naming_impact prompt exists')
assert(namingPrompt!.sourcePhase === 'both', 'naming_impact draws from both phases')
assert(namingPrompt!.text.includes('Fear'), 'naming_impact references channel')
assert(namingPrompt!.text.includes('Issue Challenge'), 'naming_impact references move')

const evalPrompt = ctx.reflectionPrompts.find(p => p.key === 'action_evaluation')
assert(evalPrompt !== undefined, 'action_evaluation prompt exists')
assert(evalPrompt!.sourcePhase === 'action', 'action_evaluation draws from action')
// Issue challenge path: should mention "avoiding"
assert(evalPrompt!.text.includes('avoiding'), 'action_evaluation has issue_challenge-specific text')

const epiphanyPrompt = ctx.reflectionPrompts.find(p => p.key === 'epiphany')
assert(epiphanyPrompt !== undefined, 'epiphany prompt exists')
assert(epiphanyPrompt!.sourcePhase === 'both', 'epiphany draws from both phases')
assert(epiphanyPrompt!.text.includes('insight'), 'epiphany prompt mentions insight')

// ---------------------------------------------------------------------------
// 6. Alternative move path (Declare Intention)
// ---------------------------------------------------------------------------
console.log('\n6. Alternative move path (Declare Intention)')

const ctx2 = buildReflectionContextFromData({
  playerId: 'player_2',
  channel: 'Joy',
  intake: { ...mockIntake, channel: 'joy', content: 'I lost my creative spark.' },
  action: mockActionDeclareIntention,
})

assert(ctx2.channel === 'Joy', 'Joy channel preserved')
assert(ctx2.action.moveId === 'propose_move', 'propose_move moveId')
assert(ctx2.action.moveTitle === 'Declare Intention', 'Declare Intention title')
assert(ctx2.action.energyDelta === 1, 'energyDelta is 1 for generative move')

// Declare Intention path: evaluation prompt should mention "commitment"
const evalPrompt2 = ctx2.reflectionPrompts.find(p => p.key === 'action_evaluation')
assert(evalPrompt2!.text.includes('intention'), 'action_evaluation has declare_intention-specific text')

// ---------------------------------------------------------------------------
// 7. Epiphany title derivation
// ---------------------------------------------------------------------------
console.log('\n7. Epiphany title derivation')

const title1 = deriveEpiphanyTitle(ctx)
assert(title1.includes('Fear'), 'epiphany title includes channel')
assert(title1.includes('Issue Challenge'), 'epiphany title includes move')
assert(title1.includes('Wake Up'), 'epiphany title includes WAVE stage')

const title2 = deriveEpiphanyTitle(ctx2)
assert(title2.includes('Joy'), 'epiphany title includes Joy channel')
assert(title2.includes('Declare Intention'), 'epiphany title includes Declare Intention')

// ---------------------------------------------------------------------------
// 8. Custom face + waveMove override
// ---------------------------------------------------------------------------
console.log('\n8. Custom face + waveMove override')

const ctx3 = buildReflectionContextFromData({
  playerId: 'player_3',
  channel: 'Anger',
  face: 'shaman',
  waveMove: 'cleanUp',
  intake: { ...mockIntake, channel: 'anger' },
  action: { ...mockActionIssueChallenge, channel: 'anger' },
})

assert(ctx3.face === 'shaman', 'custom face override works')
assert(ctx3.waveMove === 'cleanUp', 'custom waveMove override works')

// ---------------------------------------------------------------------------
// 9. Null arcStartedAt handling
// ---------------------------------------------------------------------------
console.log('\n9. Null arcStartedAt handling')

const ctx4 = buildReflectionContextFromData({
  playerId: 'player_4',
  channel: 'Sadness',
  intake: { ...mockIntake, channel: 'sadness' },
  action: { ...mockActionIssueChallenge, channel: 'sadness' },
  arcStartedAt: null,
})

assert(ctx4.arcStartedAt === null, 'null arcStartedAt preserved')

// ---------------------------------------------------------------------------
// 10. Epiphany is BAR invariant
// ---------------------------------------------------------------------------
console.log('\n10. Epiphany is BAR invariant')

// The reflection phase's regulationTo is 'satisfied' — this IS the epiphany.
// No separate Epiphany model exists.
assert(
  PHASE_REGULATION_MAP.reflection.to === 'satisfied',
  'reflection completion = satisfied = epiphany (no separate model)',
)

// The epiphany prompt exists in every context
assert(
  ctx.reflectionPrompts.some(p => p.key === 'epiphany'),
  'every context includes an epiphany prompt for BAR generation',
)

console.log('\n=== All reflection aggregator checks passed! ===')
