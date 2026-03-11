/**
 * Charge → Quest Generator — Tests
 * Run with: npx tsx src/lib/charge-quest-generator/__tests__/generator.test.ts
 */

import { generateQuestSuggestions } from '../generator'
import { extractTopic } from '../templates'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testExtractTopic() {
  assert(extractTopic("I'm frustrated about housing costs") === 'housing costs', 'Should strip prefix')
  assert(extractTopic('Housing costs crushing me') === 'Housing costs crushing me', 'Should keep when no prefix')
  assert(extractTopic('') === 'this', 'Empty should return this')
}

function testHousingAnger() {
  const result = generateQuestSuggestions({
    bar_id: 'bar_1',
    summary_text: "I'm frustrated about housing costs",
    emotion_channel: 'anger',
    intensity: 4,
  })
  assert(result.length >= 3 && result.length <= 4, 'Should return 3–4 suggestions')
  const moveTypes = result.map((r) => r.move_type)
  assert(moveTypes.includes('wake_up'), 'Should include wake_up')
  assert(moveTypes.includes('grow_up') || moveTypes.includes('show_up'), 'Should include action-oriented move')
  assert(result[0].quest_title.includes('housing'), 'First suggestion should reference topic')
}

function testColleagueConflict() {
  const result = generateQuestSuggestions({
    bar_id: 'bar_2',
    summary_text: "I'm angry at a colleague",
    emotion_channel: 'anger',
    intensity: 5,
  })
  assert(result[0].move_type === 'clean_up', 'Relational + high intensity anger → clean_up first')
  assert(result[0].quest_title.toLowerCase().includes('321') || result[0].quest_title.toLowerCase().includes('reflection'), 'Clean up should suggest reflection')
}

function testDeterministic() {
  const input = {
    bar_id: 'bar_3',
    summary_text: 'Feeling inspired to host a gathering',
    emotion_channel: 'joy' as const,
    intensity: 4,
  }
  const a = generateQuestSuggestions(input)
  const b = generateQuestSuggestions(input)
  assert(JSON.stringify(a) === JSON.stringify(b), 'Same input → same output')
}

async function run() {
  testExtractTopic()
  testHousingAnger()
  testColleagueConflict()
  testDeterministic()
  console.log('✓ All charge-quest-generator tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
