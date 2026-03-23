/**
 * PCM — personal_move / declared_move priority over emotion bias.
 * Run: npm run test:charge-move
 * @see .specify/specs/charge-capture-personal-move-commitment/spec.md
 */
import assert from 'node:assert/strict'
import { generateQuestSuggestions } from '../generator'

const base = {
  bar_id: 'bar_pcm',
  summary_text: "I'm angry at a colleague about the deadline",
  emotion_channel: 'anger' as const,
  intensity: 5,
}

function testDeclaredMoveFirstOverridesRelationalCleanUp() {
  // Without declared_move: relational + anger → clean_up first (see generator.test.ts)
  const without = generateQuestSuggestions({ ...base })
  assert.equal(without[0].move_type, 'clean_up', 'baseline: relational anger → clean_up first')

  // With declared_move grow_up: intent wins per PCM
  const withDeclared = generateQuestSuggestions({
    ...base,
    declared_move: 'grow_up',
  })
  assert.equal(withDeclared[0].move_type, 'grow_up', 'declared grow_up must be first suggestion')
  assert.ok(
    withDeclared.some((s) => s.move_type === 'clean_up'),
    'remaining slots still include emotion-relevant moves'
  )
}

function testDeclaredWakeUpOverridesJoyBias() {
  const joyInput = {
    bar_id: 'bar_joy',
    summary_text: 'Feeling inspired to host a gathering',
    emotion_channel: 'joy' as const,
    intensity: 3,
  }
  const without = generateQuestSuggestions(joyInput)
  assert.equal(without[0].move_type, 'show_up', 'joy bias → show_up first')

  const withDeclared = generateQuestSuggestions({
    ...joyInput,
    declared_move: 'wake_up',
  })
  assert.equal(withDeclared[0].move_type, 'wake_up', 'declared wake_up must be first')
}

function testNoDeclaredPreservesEmotionOrder() {
  const a = generateQuestSuggestions({
    bar_id: 'b',
    summary_text: 'test topic',
    emotion_channel: 'fear',
    intensity: 3,
  })
  const b = generateQuestSuggestions({
    bar_id: 'b',
    summary_text: 'test topic',
    emotion_channel: 'fear',
    intensity: 3,
    declared_move: null,
  })
  assert.deepEqual(
    a.map((s) => s.move_type),
    b.map((s) => s.move_type),
    'null declared_move same as omitted'
  )
}

testDeclaredMoveFirstOverridesRelationalCleanUp()
testDeclaredWakeUpOverridesJoyBias()
testNoDeclaredPreservesEmotionOrder()
console.log('charge-quest-generator: declared_move (PCM) OK')
