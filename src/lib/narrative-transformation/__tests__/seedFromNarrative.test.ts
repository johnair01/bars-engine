/**
 * Narrative Transformation — seed assembly tests
 * Run: npx tsx src/lib/narrative-transformation/__tests__/seedFromNarrative.test.ts
 */

import { buildQuestSeedFromParsed, buildQuestSeedFromText } from '../seedFromNarrative'
import { parseNarrative } from '../parse'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testBuildFromTextHasArcAndLock() {
  const seed = buildQuestSeedFromText("I'm afraid of failing the launch.")
  assert(seed.lock_type === 'emotional_lock', `lock_type ${seed.lock_type}`)
  assert(seed.source_narrative.includes('afraid'), 'source_narrative')
  assert(!!seed.arc.wake, 'arc.wake')
  assert(!!seed.arc.clean, 'arc.clean')
  assert(!!seed.arc.grow, 'arc.grow')
  assert(!!seed.arc.show, 'arc.show')
  assert(!!seed.arc.integrate, 'arc.integrate')
  assert(seed.arc.wake?.move_id === 'observe', `wake move ${seed.arc.wake?.move_id}`)
}

function testActionLockFallsBackCleanStage() {
  const parsed = parseNarrative("I can't even start; I'm completely stuck.")
  assert(parsed.lock_type === 'action_lock' || parsed.lock_type === 'emotional_lock', `lock ${parsed.lock_type}`)
  const seed = buildQuestSeedFromParsed(parsed)
  assert(!!seed.arc.clean?.prompt, 'clean prompt when action_lock may need fallback')
  assert(seed.arc.clean?.move_id === 'externalize' || seed.arc.clean?.move_id === 'feel', `clean ${seed.arc.clean?.move_id}`)
}

function testMoveOverrides() {
  const seed = buildQuestSeedFromText('I feel sad.', {
    moveOverrides: { wake: 'name', clean: 'feel' },
  })
  assert(seed.arc.wake?.move_id === 'name', 'override wake')
  assert(seed.arc.clean?.move_id === 'feel', 'override clean')
}

function testQuestSeedIdPresent() {
  const seed = buildQuestSeedFromText('Short text')
  assert(seed.quest_seed_id.startsWith('gen_'), `seed id ${seed.quest_seed_id}`)
}

function run() {
  testBuildFromTextHasArcAndLock()
  testActionLockFallsBackCleanStage()
  testMoveOverrides()
  testQuestSeedIdPresent()
  console.log('narrative-transformation seedFromNarrative tests: ok')
}

run()
