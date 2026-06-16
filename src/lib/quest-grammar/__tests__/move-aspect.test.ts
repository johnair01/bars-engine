/**
 * move-aspect — IOA move × aspect grammar (FR4/FR5).
 * Run: npx tsx src/lib/quest-grammar/__tests__/move-aspect.test.ts
 */
import assert from 'node:assert/strict'
import { describeMove, isValidEnactedMove, MOVE_ASPECT_MATRIX, FACE_HEALTHY_REGISTER, faceRegister } from '../move-aspect'
import { resolveMoveCell, moveDomain } from '../canonical-kernel'
import { GAME_MASTER_FACES, FACE_META } from '../types'
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

// --- Phase 3 ---

function testResolveMoveCellBridgesAspect() {
  // FR6: domain is invariant; aspect follows the enactment.
  for (const move of MOVES) {
    const domain = moveDomain(move)
    const inner = resolveMoveCell({ move, aspect: 'inner' })
    assert.deepEqual(inner, { domain, aspect: 'inner' }, `${move} inner cell`)
    const outer = resolveMoveCell({ move, aspect: 'outer', target: 'collective' })
    assert.deepEqual(outer, { domain, aspect: 'outer' }, `${move} outer cell = outer cell of same domain`)
  }
}

function testFaceModulatesOuterStyleOnly() {
  // FR7: a face colors an OUTER move with its healthy register; verb + target survive.
  const base = describeMove({ move: 'showUp', aspect: 'outer', target: 'collective' })
  for (const face of GAME_MASTER_FACES) {
    const styled = describeMove({ move: 'showUp', aspect: 'outer', target: 'collective' }, face)
    assert.ok(styled.includes(MOVE_ASPECT_MATRIX.showUp.outer), `${face}: verb phrase survives`)
    assert.ok(styled.includes('— with the collective'), `${face}: target clause survives`)
    assert.ok(styled.includes(FACE_HEALTHY_REGISTER[face]), `${face}: register woven in`)
    assert.notEqual(styled, base, `${face}: styling changes the phrasing`)
  }
}

function testFaceIgnoredOnInner() {
  // Faces modulate outer enactment only; inner phrasing is untouched.
  for (const face of GAME_MASTER_FACES) {
    assert.equal(
      describeMove({ move: 'growUp', aspect: 'inner' }, face),
      MOVE_ASPECT_MATRIX.growUp.inner,
      `${face}: inner phrasing unchanged`
    )
  }
}

function testNoShadowRegisterEncoded() {
  // The shadow reading (with → "for"/saviorism) is a documented seam, NOT in code.
  for (const face of GAME_MASTER_FACES) {
    const r = FACE_HEALTHY_REGISTER[face]
    assert.ok(!/savior|paternal|\bfor\b|judg/i.test(r), `${face}: register is healthy-pole only`)
  }
}

function testFaceRegisterReusesFaceMeta() {
  for (const face of GAME_MASTER_FACES) {
    const fr = faceRegister(face)
    assert.equal(fr.label, FACE_META[face].label, `${face}: label is single source of truth`)
    assert.equal(fr.register, FACE_HEALTHY_REGISTER[face], `${face}: register matches`)
  }
}

testAllTenPhrasings()
testWakeUpOuterIsWitnessNotMarket()
testTargetDefaultsAndRenders()
testValidationOuterRequiresTarget()
testValidationInnerIsSelfDirected()
testResolveMoveCellBridgesAspect()
testFaceModulatesOuterStyleOnly()
testFaceIgnoredOnInner()
testNoShadowRegisterEncoded()
testFaceRegisterReusesFaceMeta()
console.log('✓ move-aspect (IOA grammar) OK')
