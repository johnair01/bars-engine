/**
 * Minimal Agent Mind Model tests.
 * Run: npx tsx src/lib/agent-mind/__tests__/agentMind.test.ts
 */

import { createAgent } from '../createAgent'
import {
  integrateAgentResult,
  selectAgentAction,
  updateAgentNarrative,
} from '../actions'
import { generateNarrativeLock } from '../narrativeTriggers'
import { simulateQuestForAgent } from '../simulationBridge'
import { resolveNationOrThrow, resolveArchetypeOrThrow } from '../validation'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testCreateAgent() {
  const a = createAgent({
    nation: 'argyra',
    archetype: 'truth_seer',
    goal: 'Ship the demo',
    narrative_lock: "I'm afraid it won't be good enough",
  })
  assert(a.agent_id.length > 4, 'id')
  assert(a.nation === 'Argyra', 'nation name')
  assert(a.archetype === 'truth-seer', 'slug')
  assert(a.bars.length === 0, 'no bars yet')
  console.log('✓ testCreateAgent')
}

function testValidationThrows() {
  let threw = false
  try {
    resolveNationOrThrow('Atlantis')
  } catch {
    threw = true
  }
  assert(threw, 'bad nation throws')
  threw = false
  try {
    resolveArchetypeOrThrow('not-a-real-archetype')
  } catch {
    threw = true
  }
  assert(threw, 'bad archetype throws')
  console.log('✓ testValidationThrows')
}

function testSelectAndIntegrate() {
  const a = createAgent({
    nation: 'meridia',
    archetype: 'bold-heart',
    goal: 'Host a gathering',
    narrative_lock: 'I feel stuck planning',
    emotional_state: 'fear',
    energy: 0.6,
  })
  const prop = selectAgentAction(a)
  assert(prop.allowed, 'proposal allowed')
  assert(prop.action_kind === 'observe' || prop.action_kind === 'rest', 'fear path')

  const next = integrateAgentResult(a, { bar_id: 'bar_test_1', insight_note: 'Named the fear' })
  assert(next.bars.length === 1, 'bar recorded')
  console.log('✓ testSelectAndIntegrate')
}

function testNarrativeTrigger() {
  const a = createAgent({
    nation: 'pyrakanth',
    archetype: 'danger-walker',
    goal: 'Learn to surf bigger waves',
    narrative_lock: 'Starting',
    energy: 0.8,
  })
  const lock = generateNarrativeLock(a, 'low_energy')
  assert(lock.includes('depleted') || lock.toLowerCase().includes('too much'), 'low energy copy')
  const b = updateAgentNarrative(a, lock)
  assert(b.narrative_lock === lock, 'updated lock')
  console.log('✓ testNarrativeTrigger')
}

function testSimulateQuestForAgent() {
  const a = createAgent({
    nation: 'lamenth',
    archetype: 'devoted-guardian',
    goal: 'Support my partner',
    narrative_lock: "I'm overwhelmed by everyone's needs",
  })
  const r = simulateQuestForAgent(a, 42)
  assert(r.moves_selected.length >= 4, 'pipeline moves')
  assert(r.simulation_id.includes('sim_quest_'), 'sim id')
  console.log('✓ testSimulateQuestForAgent')
}

function main() {
  testCreateAgent()
  testValidationThrows()
  testSelectAndIntegrate()
  testNarrativeTrigger()
  testSimulateQuestForAgent()
  console.log('\nAll agent-mind tests passed.')
}

main()
