/**
 * move-aspect — IOA move × aspect grammar (FR4/FR5).
 * Run: npx tsx src/lib/quest-grammar/__tests__/move-aspect.test.ts
 */
import assert from 'node:assert/strict'
import { describeMove, isValidEnactedMove, MOVE_ASPECT_MATRIX } from '../move-aspect'
import type { PersonalMoveType, AllyshipTarget } from '../types'

const MOVES: PersonalMoveType[] = ['wakeUp', 'openUp', 'cleanUp', 'growUp', 'showUp']
const TARGETS: AllyshipTarget[] = ['individual', 'collective', 'system']

function testAllTenPhrasings() {
  // 5 inner + 5 outer = 10 distinct phrasings, all non-empty.
  const seen = new Set<string>()
  for (const move of MOVES) {
    const inner = describeMove({ move, aspect: 'inner' })
    assert.equal(inner, MOVE_ASPECT_MATRIX[move].inner, `${move} inner phrasing`)
    assert.ok(inner.length > 0, `${move} inner non-empty`)

    const outer = describeMove({ move, aspect: 'outer', target: MOVE_ASPECT_MATRIX[move].defaultTarget })
    assert.ok(outer.includes(MOVE_ASPECT_MATRIX[move].outer), `${move} outer includes verb phrase`)
    assert.ok(outer.includes('— with '), `${move} outer has allyship clause`)

    seen.add(inner)
    seen.add(outer)
  }
  assert.equal(seen.size, 10, 'all 10 inner/outer phrasings are distinct')
}

function testWakeUpOuterIsWitnessNotMarket() {
  const outer = describeMove({ move: 'wakeUp', aspect: 'outer', target: 'collective' })
  assert.ok(outer.includes('witness & amplify'), 'Wake Up outer = witness & amplify')
  assert.ok(!/market/i.test(outer), 'Wake Up outer drops commercial register')
}

function testTargetDefaultsAndRenders() {
  // Outer with no explicit target falls back to defaultTarget.
  const fallback = describeMove({ move: 'cleanUp', aspect: 'outer' })
  assert.ok(fallback.includes('the system'), 'cleanUp outer defaults to system target')
  // Each target renders its label.
  assert.ok(describeMove({ move: 'growUp', aspect: 'outer', target: 'individual' }).includes('another person'))
  assert.ok(describeMove({ move: 'growUp', aspect: 'outer', target: 'collective' }).includes('the collective'))
}

function testValidationOuterRequiresTarget() {
  for (const move of MOVES) {
    assert.equal(
      isValidEnactedMove({ move, aspect: 'outer' }),
      false,
      `${move} outer without target is invalid`
    )
    for (const target of TARGETS) {
      assert.equal(
        isValidEnactedMove({ move, aspect: 'outer', target }),
        true,
        `${move} outer + ${target} is valid (allow all combos)`
      )
    }
  }
}

function testValidationInnerIsSelfDirected() {
  for (const move of MOVES) {
    assert.equal(isValidEnactedMove({ move, aspect: 'inner' }), true, `${move} inner valid`)
    assert.equal(
      isValidEnactedMove({ move, aspect: 'inner', target: 'individual' }),
      false,
      `${move} inner with a target is invalid (self-directed)`
    )
  }
}

testAllTenPhrasings()
testWakeUpOuterIsWitnessNotMarket()
testTargetDefaultsAndRenders()
testValidationOuterRequiresTarget()
testValidationInnerIsSelfDirected()
console.log('✓ move-aspect (IOA grammar) OK')
