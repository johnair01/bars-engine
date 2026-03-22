/**
 * Archetype Move Styles EG — overlay + quest flavor
 * Run: npx tsx src/lib/narrative-transformation/moves/__tests__/archetype-move-styles.test.ts
 */
import assert from 'node:assert'
import { parseNarrative } from '../../parse'
import {
  applyArchetypeOverlay,
  applyArchetypeQuestFlavor,
  ARCHETYPE_MOVE_STYLES,
  getArchetypeMoveStyle,
} from '../archetype-move-styles'
import { generateQuestSeed } from '../selectMoves'

const sampleNarrative = 'I feel stuck facing a conflict at work about my role.'

function testEightStyles() {
  assert.strictEqual(ARCHETYPE_MOVE_STYLES.length, 8, 'eight playbook styles')
  const ids = new Set(ARCHETYPE_MOVE_STYLES.map((s) => s.archetypeId))
  assert(ids.has('truth-seer') && ids.has('bold-heart'), 'expected slugs')
}

function testGetArchetypeMoveStyle() {
  const ts = getArchetypeMoveStyle('truth-seer')
  assert(ts?.trigram === 'Fire', 'truth-seer trigram')
  assert(ts?.questStyleModifiers.length, 'quest modifiers')

  const fromSignal = getArchetypeMoveStyle('truth_seer')
  assert.strictEqual(fromSignal?.archetypeId, 'truth-seer', 'ARCHETYPE_KEYS resolve')

  assert.strictEqual(getArchetypeMoveStyle(undefined), undefined, 'empty key')
}

function testApplyArchetypeOverlay() {
  const healed = applyArchetypeOverlay(
    { wake: 'wrong_id', clean: 'externalize', grow: 'reframe', show: 'experiment', integrate: 'integrate' },
    'truth-seer'
  )
  assert.strictEqual(healed.wake, 'observe', 'coerce wake to archetype pref')
}

function testApplyArchetypeQuestFlavor() {
  const base = applyArchetypeQuestFlavor(
    {
      questSeedType: 'narrative_transformation',
      wake_prompt: 'a',
      cleanup_prompt: 'b',
      grow_prompt: 'c',
      show_objective: 'd',
      bar_prompt: 'e',
      archetype_style: 'x — y — z',
    },
    'bold-heart'
  )
  assert(base.archetype_style?.includes('('), 'appends tag summary')
  assert(base.archetype_quest_style_tags?.includes('leadership quests'), 'tags from profile')
}

function testNationPlusArchetypeDistinct() {
  const parsed = parseNarrative(sampleNarrative)
  const a = generateQuestSeed(parsed, { nationId: 'argyra', archetypeKey: 'truth-seer' })
  const b = generateQuestSeed(parsed, { nationId: 'argyra', archetypeKey: 'bold-heart' })
  assert.notStrictEqual(a.archetype_style, b.archetype_style, 'archetype flavor differs')
  assert.notStrictEqual(
    a.archetype_quest_style_tags?.[0],
    b.archetype_quest_style_tags?.[0],
    'quest style tags differ'
  )
}

testEightStyles()
testGetArchetypeMoveStyle()
testApplyArchetypeOverlay()
testApplyArchetypeQuestFlavor()
testNationPlusArchetypeDistinct()

console.log('✅ archetype-move-styles tests passed')
