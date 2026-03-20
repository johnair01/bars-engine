/**
 * Alchemy hints — tests
 * Run: npx tsx src/lib/narrative-transformation/__tests__/alchemyHints.test.ts
 */

import { buildTransformationHints, inferEmotionChannel } from '../alchemyHints'
import type { ParsedNarrative } from '@/lib/transformation-move-registry/types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testInferFear() {
  assert(inferEmotionChannel("I'm anxious about the review") === 'fear', 'fear')
}

function testInferAnger() {
  assert(inferEmotionChannel('I resent how this was handled') === 'anger', 'anger')
}

function testHintsMovementLength() {
  const n: ParsedNarrative = {
    raw_text: 'stuck',
    actor: 'I',
    state: 'overwhelmed',
    object: 'deadlines',
    negations: ['never'],
  }
  const h = buildTransformationHints(n)
  assert(h.movement_per_node.length === 6, '6 beats')
  assert(h.prompts_321.first_person.includes('I acknowledge'), '321 first')
}

function testFearInHints() {
  const n: ParsedNarrative = {
    raw_text: 'afraid',
    actor: 'I',
    state: 'afraid',
    object: 'failing',
  }
  assert(buildTransformationHints(n).emotion_channel === 'fear', 'channel')
}

function run() {
  testInferFear()
  testInferAnger()
  testHintsMovementLength()
  testFearInHints()
  console.log('narrative-transformation alchemyHints tests: ok')
}

run()
