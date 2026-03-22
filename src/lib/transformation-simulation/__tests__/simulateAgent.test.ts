/**
 * Agent simulation harness tests (FN Phase 2).
 * Run: npx tsx src/lib/transformation-simulation/__tests__/simulateAgent.test.ts
 */

import { createAgent } from '@/lib/agent-mind/createAgent'
import { simulateAgentRun } from '../simulateAgent'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testAgentRunProducesSteps() {
  const agent = createAgent({
    agent_id: 'test-agent-1',
    nation: 'lamenth',
    archetype: 'truth-seer',
    goal: 'Finish the chapter',
    narrative_lock: "I'm afraid the draft isn't honest enough",
    emotional_state: 'fear',
    energy: 0.55,
  })
  const run = simulateAgentRun(agent, { steps: 3, seed: 7 })
  assert(run.steps.length === 3, 'three steps')
  assert(run.steps[0].quest.moves_selected.length >= 4, 'quest moves step 1')
  assert(run.run_id.startsWith('sim_agent_'), 'run_id')
  assert(run.final_agent.bars.length >= 1, 'bars accumulate')
  console.log('✓ testAgentRunProducesSteps')
}

function testDeterministicRun() {
  const agent = createAgent({
    agent_id: 'determinism-agent',
    nation: 'argyra',
    archetype: 'bold-heart',
    goal: 'Launch',
    narrative_lock: 'I feel overwhelmed by the checklist',
    energy: 0.5,
  })
  const a = simulateAgentRun(agent, { steps: 2, seed: 42 })
  const b = simulateAgentRun(agent, { steps: 2, seed: 42 })
  assert(a.run_id === b.run_id, 'same run_id')
  assert(
    a.steps.map((s) => s.quest.simulation_id).join(',') ===
      b.steps.map((s) => s.quest.simulation_id).join(','),
    'same quest ids per step'
  )
  console.log('✓ testDeterministicRun')
}

function testNarrativeDrift() {
  // Energy must be ≥ 0.25 or step 1 always picks `rest` (+0.18), pushing past 0.35 and
  // preventing low-energy drift on even steps. 0.26 → default `integrate` (+0.04) → 0.30 < 0.35.
  const agent = createAgent({
    nation: 'meridia',
    archetype: 'devoted-guardian',
    goal: 'Care for family',
    narrative_lock: 'Tired',
    emotional_state: 'sadness',
    energy: 0.26,
  })
  const run = simulateAgentRun(agent, { steps: 4, seed: 1, narrativeDrift: true })
  const drifted = run.steps.some((s) => s.events.some((e) => e.startsWith('narrative_drift')))
  assert(drifted, 'expected drift with low energy + narrativeDrift')
  console.log('✓ testNarrativeDrift')
}

function main() {
  testAgentRunProducesSteps()
  testDeterministicRun()
  testNarrativeDrift()
  console.log('\nAll simulateAgent tests passed.')
}

main()
