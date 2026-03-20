/**
 * Quest simulation harness tests.
 * Run: npx tsx src/lib/transformation-simulation/__tests__/simulateQuest.test.ts
 */

import { simulateQuest } from '../simulateQuest'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testBasicPipeline() {
  const r = simulateQuest("I'm afraid of failing my launch")
  assert(r.moves_selected.length >= 4, 'Should select WCGS moves')
  assert(r.lock_type.length > 0, 'lock_type')
  assert(r.encounter_geometry.ranked_encounters.length >= 1, 'encounters')
  assert(r.simulation_id.startsWith('sim_quest_'), 'simulation_id')
  assert(r.parse_summary.confidence > 0, 'parse confidence')
  assert(Object.keys(r.generated_prompts).length >= 1, 'prompts')
  console.log('✓ testBasicPipeline')
}

function testDeterministicIdWithSeed() {
  const n = 'Same line every time.'
  const a = simulateQuest(n, { seed: 99 })
  const b = simulateQuest(n, { seed: 99 })
  assert(a.simulation_id === b.simulation_id, 'Same seed → same id')
  const c = simulateQuest(n, { seed: 100 })
  assert(a.simulation_id !== c.simulation_id, 'Different seed → different id')
  console.log('✓ testDeterministicIdWithSeed')
}

function testNationArchetypeOptions() {
  const r = simulateQuest('I feel overwhelmed by deadlines', {
    nationId: 'argyra',
    archetypeKey: 'truth-seer',
  })
  assert(r.moves_selected.includes('integrate') || r.moves_selected.length >= 4, 'moves')
  assert(r.quest_template.lock_type !== undefined, 'template')
  console.log('✓ testNationArchetypeOptions')
}

function main() {
  testBasicPipeline()
  testDeterministicIdWithSeed()
  testNationArchetypeOptions()
  console.log('\nAll simulateQuest tests passed.')
}

main()
