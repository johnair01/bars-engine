import * as assert from 'node:assert'
import {
  MOVE_EXPRESSION,
  moveAffordsRegister,
  primaryRegisterForCard,
  primaryRegisterForMove,
  registersForCard,
  registersForMove,
} from '../expression-register'
import type { BasicMove } from '../types'

const ALL_MOVES: BasicMove[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']

// Every move's primary register is one it actually affords.
for (const move of ALL_MOVES) {
  const e = MOVE_EXPRESSION[move]
  assert.ok(e.affords.includes(e.primary), `${move}: primary register must be in affords`)
  assert.ok(e.affords.length >= 1, `${move}: must afford at least one register`)
}

// Point-native = the outward moves; Witness-native = the metabolizing moves.
assert.strictEqual(primaryRegisterForMove('wake_up'), 'point')
assert.strictEqual(primaryRegisterForMove('show_up'), 'point')
assert.strictEqual(primaryRegisterForMove('open_up'), 'witness')
assert.strictEqual(primaryRegisterForMove('clean_up'), 'witness')
assert.strictEqual(primaryRegisterForMove('grow_up'), 'witness')

// Clean Up is the hinge — affords both registers.
assert.deepStrictEqual([...registersForMove('clean_up')].sort(), ['point', 'witness'])
assert.ok(moveAffordsRegister('clean_up', 'point'))
assert.ok(moveAffordsRegister('clean_up', 'witness'))

// Open and Grow are witness-only (reception and becoming are inherently first-person).
assert.deepStrictEqual(registersForMove('open_up'), ['witness'])
assert.deepStrictEqual(registersForMove('grow_up'), ['witness'])
assert.strictEqual(moveAffordsRegister('open_up', 'point'), false)
assert.strictEqual(moveAffordsRegister('grow_up', 'point'), false)

// Card-level helpers read the move.
assert.strictEqual(primaryRegisterForCard({ move: 'wake_up' }), 'point')
assert.strictEqual(primaryRegisterForCard({ move: 'grow_up' }), 'witness')
assert.deepStrictEqual(registersForCard({ move: 'show_up' }), ['point', 'witness'])

// The four slice cards resolve to the registers the Witness Turn demonstrated.
assert.strictEqual(primaryRegisterForCard({ move: 'wake_up' }), 'point') // WAKE-RA-ARCHITECT
assert.strictEqual(primaryRegisterForCard({ move: 'show_up' }), 'point') // SHOW-RA-CHALLENGER
assert.strictEqual(primaryRegisterForCard({ move: 'open_up' }), 'witness') // OPEN-RA-SHAMAN
assert.strictEqual(primaryRegisterForCard({ move: 'grow_up' }), 'witness') // GROW-RA-SHAMAN

console.log('expression-register: all assertions passed')
