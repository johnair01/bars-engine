/**
 * Full pipeline smoke test
 * Run: npx tsx src/lib/narrative-transformation/__tests__/fullPipeline.test.ts
 */

import { runNarrativeTransformationFull } from '../fullPipeline'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  const { parse, hints, questSeed } = runNarrativeTransformationFull('I feel angry at the delay.')
  assert(parse.state.toLowerCase().includes('angry') || parse.raw_text.includes('angry'), 'parse')
  assert(hints.emotion_channel === 'anger', `hints channel ${hints.emotion_channel}`)
  assert(!!questSeed.arc.wake, 'seed')
}

run()
console.log('narrative-transformation fullPipeline tests: ok')
