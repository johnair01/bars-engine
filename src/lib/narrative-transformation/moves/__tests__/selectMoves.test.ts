/**
 * Transformation Move Library v1 — selection tests
 * Run: npx tsx src/lib/narrative-transformation/moves/__tests__/selectMoves.test.ts
 */

import { parseNarrative } from '../../parse'
import {
  generateQuestSeed,
  selectDefaultMoveIds,
  selectMoves,
} from '../selectMoves'
import {
  resolveArchetypeKeyForTransformation,
  resolvePlaybookArchetypeKey,
} from '../archetype-profiles'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

function testNationChangesWakePreference() {
  const parsed = parseNarrative("I'm afraid of failing the launch.")
  assert(parsed.lock_type === 'emotional_lock' || !!parsed.lock_type, 'parse lock')
  const argyra = selectDefaultMoveIds(parsed, { nationId: 'argyra' })
  const pyrakanth = selectDefaultMoveIds(parsed, { nationId: 'pyrakanth' })
  assert(argyra.wake === 'observe', `argyra wake ${argyra.wake}`)
  assert(pyrakanth.wake === 'name', `pyrakanth wake ${pyrakanth.wake}`)
}

function testArchetypeTruthSeerBias() {
  const parsed = parseNarrative('I feel torn between two paths.')
  const without = selectDefaultMoveIds(parsed, { nationId: 'meridia' })
  const withArch = selectDefaultMoveIds(parsed, { nationId: 'meridia', archetypeKey: 'truth-seer' })
  assert(without.wake === 'name', `baseline meridia wake ${without.wake}`)
  assert(withArch.wake === 'observe', `truth-seer wake ${withArch.wake}`)
}

function testSignalKeyMapsToPlaybook() {
  assert(resolvePlaybookArchetypeKey('truth_seer') === 'truth-seer', 'truth_seer map')
  assert(resolvePlaybookArchetypeKey('root_tender') === 'devoted-guardian', 'root_tender map')
  assert(resolveArchetypeKeyForTransformation('truth_seer') === 'truth-seer', 'EI API truth_seer')
  assert(resolveArchetypeKeyForTransformation('bogus') === null, 'EI API null')
}

function testSelectMovesReturnsFiveRows() {
  const parsed = parseNarrative('Short narrative.')
  const rows = selectMoves(parsed, { nationId: 'lamenth' })
  assert(rows.length === 5, `rows ${rows.length}`)
  assert(rows[0].wcgs_stage === 'wake_up', 'first wake')
  assert(rows[4].move_id === 'integrate', 'last integrate')
}

function testFlatQuestSeedWcgs() {
  const parsed = parseNarrative('Something about {object}') // parse still fills slots
  const flat = generateQuestSeed(parsed, { nationId: 'virelune', archetypeKey: 'joyful-connector' })
  assert(flat.questSeedType === 'narrative_transformation', 'type')
  assert(flat.wake_prompt.length > 0, 'wake')
  assert(flat.cleanup_prompt.length > 0, 'cleanup')
  assert(flat.grow_prompt.length > 0, 'grow')
  assert(flat.show_objective.length > 0, 'show')
  assert(flat.bar_prompt.length > 0, 'bar')
  assert(!!flat.nation_flavor?.includes('joyful'), `nation flavor ${flat.nation_flavor}`)
  assert(!!flat.archetype_style?.includes('connection'), `archetype ${flat.archetype_style}`)
}

function run() {
  testNationChangesWakePreference()
  testArchetypeTruthSeerBias()
  testSignalKeyMapsToPlaybook()
  testSelectMovesReturnsFiveRows()
  testFlatQuestSeedWcgs()
  console.log('transformation-move-library selectMoves tests: ok')
}

run()
