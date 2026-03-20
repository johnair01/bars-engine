/**
 * Narrative Transformation — lock detection tests
 * Run: npx tsx src/lib/narrative-transformation/__tests__/lockDetection.test.ts
 */

import { detectLockType } from '../lockDetection'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testEmotional() {
  const l = detectLockType('I feel ashamed when I speak up.')
  assert(l === 'emotional_lock', `expected emotional_lock, got ${l}`)
}

function testIdentity() {
  const l = detectLockType("I'm just a people pleaser — that's who I am.")
  assert(l === 'identity_lock', `expected identity_lock, got ${l}`)
}

function testAction() {
  const l = detectLockType("I can't even start the task; I'm stuck.")
  assert(l === 'action_lock', `expected action_lock, got ${l}`)
}

function testPossibility() {
  const l = detectLockType("There's no way this will work — why bother?")
  assert(l === 'possibility_lock', `expected possibility_lock, got ${l}`)
}

function testWeak() {
  const l = detectLockType('ok')
  assert(l === undefined, `expected undefined for weak text, got ${l}`)
}

function run() {
  testEmotional()
  testIdentity()
  testAction()
  testPossibility()
  testWeak()
  console.log('narrative-transformation lockDetection tests: ok')
}

run()
