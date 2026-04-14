/**
 * Alchemy Engine — Reflection Aggregator Tests
 *
 * Run with: npx tsx src/lib/alchemy-engine/__tests__/reflection-aggregator.test.ts
 *
 * Tests the pure functions that aggregate Intake + Action phase data
 * into a structured ReflectionContext and format it for AI generation.
 *
 * DB-dependent functions (aggregateReflectionContext) are NOT tested here;
 * these tests exercise the pure builders and formatters.
 */

import assert from 'node:assert'
import {
  buildReflectionContextFromData,
  deriveEpiphanyTitle,
  formatReflectionForAI,
  getReflectionPromptMap,
  summarizeEmotionalArc,
  type IntakePhaseData,
  type ActionPhaseData,
  type ReflectionContext,
} from '../reflection-aggregator'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeIntakeData(overrides: Partial<IntakePhaseData> = {}): IntakePhaseData {
  return {
    barId: 'intake-bar-001',
    title: 'Wake Up — Anger Intake',
    content: 'I named the thing that has been gnawing at me: I avoid hard conversations.',
    channel: 'anger',
    regulationFrom: 'dissatisfied',
    regulationTo: 'neutral',
    createdAt: new Date('2026-04-07T10:00:00Z'),
    ...overrides,
  }
}

function makeActionData(overrides: Partial<ActionPhaseData> = {}): ActionPhaseData {
  return {
    barId: 'action-bar-001',
    title: 'Issue Challenge — Anger Action',
    content: 'I will have the conversation I have been avoiding with my collaborator this week.',
    moveId: 'issue_challenge',
    moveTitle: 'Issue Challenge',
    canonicalMoveId: 'fire_transcend',
    energyDelta: 2,
    moveNarrative: 'Anger → boundary honored',
    channel: 'anger',
    regulationFrom: 'neutral',
    regulationTo: 'neutral',
    createdAt: new Date('2026-04-07T10:05:00Z'),
    ...overrides,
  }
}

function makeReflectionContext(
  overrides: Partial<Parameters<typeof buildReflectionContextFromData>[0]> = {},
): ReflectionContext {
  return buildReflectionContextFromData({
    playerId: 'player-001',
    channel: 'Anger',
    intake: makeIntakeData(),
    action: makeActionData(),
    ...overrides,
  })
}

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error(`    ${err instanceof Error ? err.message : String(err)}`)
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──`)
}

// ---------------------------------------------------------------------------
// buildReflectionContextFromData
// ---------------------------------------------------------------------------

section('buildReflectionContextFromData')

test('assembles a complete ReflectionContext from intake + action data', () => {
  const ctx = makeReflectionContext()
  assert.strictEqual(ctx.playerId, 'player-001')
  assert.strictEqual(ctx.channel, 'Anger')
  assert.strictEqual(ctx.face, 'challenger')
  assert.strictEqual(ctx.waveMove, 'wakeUp')
  assert.strictEqual(ctx.currentPhase, 'reflection')
})

test('includes phase-locked regulation trajectory', () => {
  const ctx = makeReflectionContext()
  assert.deepStrictEqual(ctx.regulationTrajectory, {
    intake: { from: 'dissatisfied', to: 'neutral' },
    action: { from: 'neutral', to: 'neutral' },
    reflection: { from: 'neutral', to: 'satisfied' },
  })
})

test('preserves intake phase data', () => {
  const ctx = makeReflectionContext()
  assert.strictEqual(ctx.intake.barId, 'intake-bar-001')
  assert.ok(ctx.intake.content.includes('avoid hard conversations'))
  assert.strictEqual(ctx.intake.regulationFrom, 'dissatisfied')
  assert.strictEqual(ctx.intake.regulationTo, 'neutral')
})

test('preserves action phase data with move metadata', () => {
  const ctx = makeReflectionContext()
  assert.strictEqual(ctx.action.barId, 'action-bar-001')
  assert.strictEqual(ctx.action.moveId, 'issue_challenge')
  assert.strictEqual(ctx.action.moveTitle, 'Issue Challenge')
  assert.strictEqual(ctx.action.energyDelta, 2)
  assert.strictEqual(ctx.action.moveNarrative, 'Anger → boundary honored')
})

test('generates a narrative summary (non-AI path)', () => {
  const ctx = makeReflectionContext()
  assert.ok(ctx.narrativeSummary.includes('challenger face'))
  assert.ok(ctx.narrativeSummary.includes('Anger'))
  assert.ok(ctx.narrativeSummary.includes('Intake'))
  assert.ok(ctx.narrativeSummary.includes('Action'))
  assert.ok(ctx.narrativeSummary.includes('dissatisfied'))
})

test('generates 3 reflection prompts derived from prior phases', () => {
  const ctx = makeReflectionContext()
  assert.strictEqual(ctx.reflectionPrompts.length, 3)

  const namingPrompt = ctx.reflectionPrompts.find(p => p.key === 'naming_impact')!
  assert.ok(namingPrompt, 'naming_impact prompt exists')
  assert.strictEqual(namingPrompt.sourcePhase, 'both')
  assert.ok(namingPrompt.text.includes('Anger'))

  const actionPrompt = ctx.reflectionPrompts.find(p => p.key === 'action_evaluation')!
  assert.ok(actionPrompt, 'action_evaluation prompt exists')
  assert.strictEqual(actionPrompt.sourcePhase, 'action')
  assert.ok(actionPrompt.text.includes('challenge'))

  const epiphanyPrompt = ctx.reflectionPrompts.find(p => p.key === 'epiphany')!
  assert.ok(epiphanyPrompt, 'epiphany prompt exists')
  assert.strictEqual(epiphanyPrompt.sourcePhase, 'both')
  assert.ok(epiphanyPrompt.text.includes('see now'))
})

test('uses vertical slice defaults when face/waveMove omitted', () => {
  const ctx = buildReflectionContextFromData({
    playerId: 'player-002',
    channel: 'Fear',
    intake: makeIntakeData({ channel: 'fear' }),
    action: makeActionData({ channel: 'fear' }),
  })
  assert.strictEqual(ctx.face, 'challenger')
  assert.strictEqual(ctx.waveMove, 'wakeUp')
})

test('handles propose_move action (second Challenger move)', () => {
  const ctx = makeReflectionContext({
    action: makeActionData({
      moveId: 'propose_move',
      moveTitle: 'Declare Intention',
      canonicalMoveId: 'wood_fire',
      energyDelta: 1,
      moveNarrative: 'Momentum into action',
    }),
  })
  const actionPrompt = ctx.reflectionPrompts.find(p => p.key === 'action_evaluation')!
  assert.ok(actionPrompt.text.includes('intention'))
})

test('works with all five emotional channels', () => {
  const channels = ['Fear', 'Anger', 'Sadness', 'Joy', 'Neutrality'] as const
  for (const ch of channels) {
    const ctx = makeReflectionContext({ channel: ch })
    assert.strictEqual(ctx.channel, ch)
    assert.ok(ctx.narrativeSummary.includes(ch), `Narrative includes ${ch}`)
  }
})

// ---------------------------------------------------------------------------
// deriveEpiphanyTitle
// ---------------------------------------------------------------------------

section('deriveEpiphanyTitle')

test('generates a title from channel + move + wave', () => {
  const ctx = makeReflectionContext()
  const title = deriveEpiphanyTitle(ctx)
  assert.strictEqual(title, 'Anger Epiphany — Issue Challenge (Wake Up)')
})

test('adapts to different channels', () => {
  const ctx = makeReflectionContext({ channel: 'Joy' })
  const title = deriveEpiphanyTitle(ctx)
  assert.ok(title.includes('Joy Epiphany'))
})

// ---------------------------------------------------------------------------
// formatReflectionForAI
// ---------------------------------------------------------------------------

section('formatReflectionForAI')

test('returns system, user, and metadata fields', () => {
  const ctx = makeReflectionContext()
  const prompt = formatReflectionForAI(ctx)
  assert.ok(typeof prompt.system === 'string')
  assert.ok(typeof prompt.user === 'string')
  assert.ok(typeof prompt.metadata === 'object')
})

test('system prompt establishes Challenger persona', () => {
  const ctx = makeReflectionContext()
  const { system } = formatReflectionForAI(ctx)
  assert.ok(system.includes('Challenger'))
  assert.ok(system.includes('direct'))
})

test('system prompt includes channel-specific element context', () => {
  const ctx = makeReflectionContext({ channel: 'Anger' })
  const { system } = formatReflectionForAI(ctx)
  assert.ok(system.includes('Fire'))
  assert.ok(system.includes('boundary'))
})

test('system prompt constrains output to be the BAR content', () => {
  const ctx = makeReflectionContext()
  const { system } = formatReflectionForAI(ctx)
  assert.ok(system.includes('epiphany artifact'))
  assert.ok(system.includes('Reflection BAR'))
  assert.ok(system.includes('ONLY the reflection text'))
})

test('system prompt instructs grounding in player behavior', () => {
  const ctx = makeReflectionContext()
  const { system } = formatReflectionForAI(ctx)
  assert.ok(system.includes('ACTUALLY wrote'))
  assert.ok(system.includes('Do not invent'))
})

test('system prompt includes Wake Up WAVE stage context', () => {
  const ctx = makeReflectionContext()
  const { system } = formatReflectionForAI(ctx)
  assert.ok(system.includes('Wake Up'))
})

test('user prompt includes intake content', () => {
  const ctx = makeReflectionContext()
  const { user } = formatReflectionForAI(ctx)
  assert.ok(user.includes('avoid hard conversations'))
  assert.ok(user.includes('Intake'))
})

test('user prompt includes action content and move selection', () => {
  const ctx = makeReflectionContext()
  const { user } = formatReflectionForAI(ctx)
  assert.ok(user.includes('Issue Challenge'))
  assert.ok(user.includes('collaborator this week'))
  assert.ok(user.includes('+2'))
})

test('user prompt includes emotional arc trajectory', () => {
  const ctx = makeReflectionContext()
  const { user } = formatReflectionForAI(ctx)
  assert.ok(user.includes('dissatisfied'))
  assert.ok(user.includes('neutral'))
})

test('user prompt includes the reflection request', () => {
  const ctx = makeReflectionContext()
  const { user } = formatReflectionForAI(ctx)
  assert.ok(user.includes('epiphany'))
  assert.ok(user.includes("couldn't see before"))
})

test('metadata includes all provenance fields', () => {
  const ctx = makeReflectionContext()
  const { metadata } = formatReflectionForAI(ctx)
  assert.strictEqual(metadata.playerId, 'player-001')
  assert.strictEqual(metadata.channel, 'Anger')
  assert.strictEqual(metadata.face, 'challenger')
  assert.strictEqual(metadata.waveMove, 'wakeUp')
  assert.strictEqual(metadata.arcPhase, 'reflection')
  assert.strictEqual(metadata.intakeBarId, 'intake-bar-001')
  assert.strictEqual(metadata.actionBarId, 'action-bar-001')
})

test('metadata reports user message length for token budgeting', () => {
  const ctx = makeReflectionContext()
  const { metadata, user } = formatReflectionForAI(ctx)
  assert.strictEqual(metadata.userMessageLength, user.length)
  assert.ok(metadata.userMessageLength > 0)
})

test('adapts thematic context per channel', () => {
  const channels: Array<{ channel: 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Neutrality'; element: string }> = [
    { channel: 'Fear', element: 'Metal' },
    { channel: 'Anger', element: 'Fire' },
    { channel: 'Sadness', element: 'Water' },
    { channel: 'Joy', element: 'Wood' },
    { channel: 'Neutrality', element: 'Earth' },
  ]

  for (const { channel, element } of channels) {
    const ctx = makeReflectionContext({ channel })
    const { system, user } = formatReflectionForAI(ctx)
    assert.ok(system.includes(element), `System prompt includes ${element} for ${channel}`)
    assert.ok(user.includes(channel), `User prompt includes ${channel}`)
  }
})

// ---------------------------------------------------------------------------
// getReflectionPromptMap
// ---------------------------------------------------------------------------

section('getReflectionPromptMap')

test('returns a key-value map of reflection prompts', () => {
  const ctx = makeReflectionContext()
  const map = getReflectionPromptMap(ctx)
  const keys = Object.keys(map).sort()
  assert.deepStrictEqual(keys, ['action_evaluation', 'epiphany', 'naming_impact'])
  assert.ok(typeof map.naming_impact === 'string')
  assert.ok(typeof map.epiphany === 'string')
})

// ---------------------------------------------------------------------------
// summarizeEmotionalArc
// ---------------------------------------------------------------------------

section('summarizeEmotionalArc')

test('produces a compact arc summary', () => {
  const ctx = makeReflectionContext()
  const summary = summarizeEmotionalArc(ctx)
  assert.ok(summary.includes('Anger arc'))
  assert.ok(summary.includes('challenger face'))
  assert.ok(summary.includes('wakeUp wave'))
  assert.ok(summary.includes('Issue Challenge'))
  assert.ok(summary.includes('+2 energy'))
  assert.ok(summary.includes('dissatisfied → neutral → satisfied'))
})

test('handles negative energy delta', () => {
  const ctx = makeReflectionContext({
    action: makeActionData({ energyDelta: -1, moveTitle: 'Control Move' }),
  })
  const summary = summarizeEmotionalArc(ctx)
  assert.ok(summary.includes('-1 energy'))
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'═'.repeat(60)}`)
console.log(`  Reflection Aggregator: ${passed} passed, ${failed} failed`)
console.log('═'.repeat(60))

if (failed > 0) {
  process.exit(1)
}
