/**
 * Shadow name grammar — multi-suggest attempt tests.
 * Run: npx tsx src/lib/shadow-name-grammar/__tests__/deriveShadowName.test.ts
 */

import { deriveShadowName, shadowNameHashPayload } from '../../shadow-name-grammar'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

function testAttempt0MatchesLegacySingleHash() {
  const charge = 'heavy guilt about work'
  const mask = 'a wall that presses'
  assert(deriveShadowName(charge, mask, 0) === 'The Mediator of Open', 'known snapshot attempt 0')
  assert(deriveShadowName(charge, mask, 0) === deriveShadowName(charge, mask), 'default arg = attempt 0')
}

function testParityWithPythonSnapshot() {
  const charge = 'heavy guilt about work'
  const mask = 'a wall that presses'
  assert(deriveShadowName(charge, mask, 1) === 'Exacting Planner', 'attempt 1')
  assert(deriveShadowName(charge, mask, 2) === 'Sacred Witness', 'attempt 2')
  assert(deriveShadowName(charge, mask, 3) === 'Reckless Hunter', 'attempt 3')
}

function testStablePerTriple() {
  const charge = 'x'
  const mask = 'y'
  for (const a of [0, 1, 5, 99]) {
    const u = deriveShadowName(charge, mask, a)
    const v = deriveShadowName(charge, mask, a)
    assert(u === v, `stable for attempt ${a}`)
  }
}

function testMultipleAttemptsMostlyDistinct() {
  const charge = 'charge text for variety'
  const mask = 'mask shape here'
  const set = new Set<string>()
  for (let a = 0; a < 24; a++) set.add(deriveShadowName(charge, mask, a))
  assert(set.size >= 4, 'expect several distinct names over 24 attempts')
}

function testEmptyInput() {
  assert(deriveShadowName('', '', 0) === 'The Unnamed Presence', 'empty')
  assert(deriveShadowName('', '', 5) === 'The Unnamed Presence', 'empty ignores attempt')
}

function testHashPayloadMatchesPython() {
  assert(shadowNameHashPayload('hello world', 0) === 'hello world', 'attempt 0 no suffix')
  assert(shadowNameHashPayload('hello world', 1) === 'hello world\0' + '1', 'attempt 1 nul + 1')
}

function main() {
  testAttempt0MatchesLegacySingleHash()
  testParityWithPythonSnapshot()
  testStablePerTriple()
  testMultipleAttemptsMostlyDistinct()
  testEmptyInput()
  testHashPayloadMatchesPython()
  console.log('shadow-name-grammar tests: ok')
}

main()
