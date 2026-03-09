/**
 * Transformation Move Registry v0 — Tests
 * Spec: .specify/specs/transformation-move-registry/spec.md
 *
 * Run with: npx tsx src/lib/transformation-move-registry/__tests__/registry.test.ts
 */

import {
  CANONICAL_MOVES,
  getMovesByStage,
  getMovesByLockType,
  getMovesByStageAndLock,
  getMoveById,
  renderPromptTemplate,
  renderMovePrompt,
  assembleQuestSeed,
} from '../index'
import type { ParsedNarrative } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testSchemaConformance() {
  assert(CANONICAL_MOVES.length === 8, 'Should have exactly 8 canonical moves')

  const required = [
    'move_id',
    'move_name',
    'move_category',
    'wcgs_stage',
    'description',
    'purpose',
    'prompt_templates',
    'target_effect',
    'typical_output_type',
    'compatible_lock_types',
    'compatible_emotion_channels',
    'compatible_nations',
    'compatible_archetypes',
    'bar_integration',
    'quest_usage',
    'safety_notes',
  ]

  for (const move of CANONICAL_MOVES) {
    for (const field of required) {
      assert(
        (move as unknown as Record<string, unknown>)[field] !== undefined,
        `Move ${move.move_id} must have ${field}`
      )
    }
    assert(move.prompt_templates.length >= 1, `Move ${move.move_id} must have at least 1 template`)
    assert(move.bar_integration != null, `Move ${move.move_id} must have bar_integration`)
    assert(move.quest_usage != null, `Move ${move.move_id} must have quest_usage`)
  }
}

function testFilterByStage() {
  const wake = getMovesByStage('wake_up')
  assert(wake.length === 2, 'Wake Up should have 2 moves')
  assert(wake.every((m) => m.wcgs_stage === 'wake_up'), 'All should be wake_up')

  const clean = getMovesByStage('clean_up')
  assert(clean.length === 2, 'Clean Up should have 2 moves')

  const grow = getMovesByStage('grow_up')
  assert(grow.length === 2, 'Grow Up should have 2 moves')

  const show = getMovesByStage('show_up')
  assert(show.length === 2, 'Show Up should have 2 moves')
}

function testFilterByLockType() {
  const emotional = getMovesByLockType('emotional_lock')
  assert(emotional.length > 0, 'Should have moves for emotional_lock')
  assert(
    emotional.every((m) => m.compatible_lock_types.includes('emotional_lock')),
    'All should be compatible with emotional_lock'
  )
}

function testFilterByStageAndLock() {
  const result = getMovesByStageAndLock('wake_up', 'emotional_lock')
  assert(result.length >= 1, 'Should have at least 1 move')
  assert(result.every((m) => m.wcgs_stage === 'wake_up'), 'All should be wake_up')
  assert(
    result.every((m) => m.compatible_lock_types.includes('emotional_lock')),
    'All should be compatible with emotional_lock'
  )
}

function testBarIntegrationMetadata() {
  const integrate = getMoveById('integrate')
  assert(integrate != null, 'Integrate move should exist')
  assert(integrate!.bar_integration.creates_bar === true, 'Integrate should create BAR')
  assert(
    integrate!.bar_integration.bar_prompt_template != null,
    'Integrate should have bar_prompt_template'
  )

  const experiment = getMoveById('experiment')
  assert(experiment != null, 'Experiment move should exist')
  assert(experiment!.bar_integration.creates_bar === true, 'Experiment should create BAR')
}

function testPromptRendering() {
  const narrative: ParsedNarrative = {
    raw_text: 'I am afraid of failing',
    actor: 'I',
    state: 'afraid',
    object: 'failing',
  }

  const result = renderPromptTemplate(
    'What story are you telling yourself about {object}?',
    narrative
  )
  assert(result === 'What story are you telling yourself about failing?', 'Should replace {object}')

  const observe = getMoveById('observe')!
  const movePrompt = renderMovePrompt(observe, narrative)
  assert(movePrompt.includes('failing'), 'Should contain object')
  assert(!movePrompt.includes('{object}'), 'Should not contain unreplaced placeholder')

  const withContext = renderPromptTemplate(
    'If {emotion_channel} had a shape, what would it be?',
    narrative,
    { emotion_channel: 'fear' }
  )
  assert(withContext === 'If fear had a shape, what would it be?', 'Should replace emotion_channel')
}

function testQuestSeedAssembly() {
  const narrative: ParsedNarrative = {
    raw_text: 'I am afraid of failing',
    actor: 'I',
    state: 'afraid',
    object: 'failing',
  }

  const seed = assembleQuestSeed(narrative, 'emotional_lock', {
    wake: 'observe',
    clean: 'feel',
    grow: 'reframe',
    show: 'experiment',
    integrate: 'integrate',
  })

  assert(seed.source_narrative === 'I am afraid of failing', 'Should preserve source')
  assert(seed.lock_type === 'emotional_lock', 'Should preserve lock type')
  assert(seed.arc.wake?.move_id === 'observe', 'Wake should be observe')
  assert(Boolean(seed.arc.wake?.prompt?.includes('failing')), 'Wake prompt should contain object')
  assert(seed.arc.clean?.move_id === 'feel', 'Clean should be feel')
  assert(seed.arc.grow?.move_id === 'reframe', 'Grow should be reframe')
  assert(seed.arc.show?.move_id === 'experiment', 'Show should be experiment')
  assert(seed.arc.integrate?.move_id === 'integrate', 'Integrate should be integrate')
  assert(Boolean(seed.arc.integrate?.bar_prompt), 'Integrate should have bar_prompt')
}

// Run all tests
const tests = [
  testSchemaConformance,
  testFilterByStage,
  testFilterByLockType,
  testFilterByStageAndLock,
  testBarIntegrationMetadata,
  testPromptRendering,
  testQuestSeedAssembly,
]

let passed = 0
for (const test of tests) {
  try {
    test()
    passed++
    console.log(`✓ ${test.name}`)
  } catch (e) {
    console.error(`✗ ${test.name}:`, (e as Error).message)
    process.exit(1)
  }
}
console.log(`\n${passed}/${tests.length} tests passed`)
