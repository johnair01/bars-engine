/**
 * Run: npx tsx src/lib/__tests__/shadow321-name-resolution.test.ts
 */

import {
  computeShadow321NameFields,
  type Shadow321NameFields,
} from '../shadow321-name-resolution'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

function testNoName() {
  assert(computeShadow321NameFields('', null, 0) === undefined, 'empty')
  assert(computeShadow321NameFields('  ', null, 0) === undefined, 'whitespace')
}

function testTypedNoSuggest() {
  const r = computeShadow321NameFields('The Cynic', null, 0)
  assert(r?.nameResolution === 'typed_no_suggest' && r.suggestionCount === 0, 'typed')
}

function testAccepted() {
  const r = computeShadow321NameFields('Exacting Planner', 'Exacting Planner', 2)
  assert(r?.nameResolution === 'suggested_accepted', 'accepted')
  assert(r?.suggestionCount === 2, 'count')
}

function testEdited() {
  const r = computeShadow321NameFields('My Own', 'Exacting Planner', 1)
  assert(r?.nameResolution === 'edited', 'edited')
}

function main() {
  testNoName()
  testTypedNoSuggest()
  testAccepted()
  testEdited()
  const fields: Shadow321NameFields | undefined = computeShadow321NameFields('x', null, 0)
  assert(fields?.finalShadowName === 'x', 'shape')
  console.log('shadow321-name-resolution tests: ok')
}

main()
