/**
 * Narrative Transformation — parse tests
 * Run: npx tsx src/lib/narrative-transformation/__tests__/parse.test.ts
 */

import { parseNarrative } from '../parse'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testAfraidOf() {
  const r = parseNarrative("I'm afraid of failing the launch.")
  assert(r.state === 'afraid', 'state')
  assert(r.object.includes('failing'), `object got ${r.object}`)
  assert(r.actor === 'I', 'actor')
  assert((r.parse_confidence ?? 0) > 0.7, 'confidence')
}

function testIAmA() {
  const r = parseNarrative('I am a fraud.')
  assert(r.state.toLowerCase().includes('fraud'), `state: ${r.state}`)
}

function testIFeel() {
  const r = parseNarrative('I feel overwhelmed by the scope.')
  assert(r.state.toLowerCase().includes('overwhelmed'), `state: ${r.state}`)
}

function testMakesMe() {
  const r = parseNarrative('My boss makes me small.')
  assert(r.object.toLowerCase().includes('boss'), `object: ${r.object}`)
  assert(r.state.toLowerCase().includes('small'), `state: ${r.state}`)
}

function testNegations() {
  const r = parseNarrative("I can't start; I never finish.")
  assert(!!r.negations?.length, 'negations')
}

function testLockCombined() {
  const r = parseNarrative('I feel stuck and like I am a failure.')
  assert(!!r.lock_type, `expected lock_type, got ${r.lock_type}`)
}

function run() {
  testAfraidOf()
  testIAmA()
  testIFeel()
  testMakesMe()
  testNegations()
  testLockCombined()
  console.log('narrative-transformation parse tests: ok')
}

run()
