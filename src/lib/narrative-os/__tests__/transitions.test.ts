import assert from 'node:assert'
import {
  BASELINE_LOOP_HINTS,
  getDefaultRecommendedTransitions,
  resolveMapTransition,
} from '../transitions'

assert.strictEqual(BASELINE_LOOP_HINTS.length, 4)
assert.strictEqual(getDefaultRecommendedTransitions().length, 4)

const libToDojo = resolveMapTransition('library', 'dojo')
assert.strictEqual(libToDojo.ok, true)
assert.strictEqual(libToDojo.variant, 'forward')
assert.ok(libToDojo.narrativeCopy.length > 0)
assert.strictEqual(libToDojo.targetHref, '/narrative/dojo')

const stay = resolveMapTransition('forest', 'forest')
assert.strictEqual(stay.ok, true)
assert.strictEqual(stay.variant, 'stay')

const back = resolveMapTransition('dojo', 'library')
assert.strictEqual(back.ok, true)
assert.strictEqual(back.variant, 'return')

const skip = resolveMapTransition('library', 'forest')
assert.strictEqual(skip.ok, false)
assert.strictEqual(skip.variant, 'invalid')

console.log('narrative-os transitions tests ok')
