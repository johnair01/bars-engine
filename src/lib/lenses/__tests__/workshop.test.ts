import assert from 'node:assert/strict'
import {
  cleanLensKeptIndexes,
  cleanLensOptions,
  nextLensCadence,
  normalizeLensAlignmentType,
  validateDescentInput,
} from '@/lib/lenses/workshop'

function testOptionCaps() {
  const options = cleanLensOptions([
    ' one ',
    '',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
  ])

  assert.equal(options.length, 10)
  assert.equal(options[0], 'one')
  assert.equal(options[9], 'ten')
}

function testKeptCapsAndDedupe() {
  const kept = cleanLensKeptIndexes([0, 0, 4, 1, 2, 3, 99, -1], ['a', 'b', 'c', 'd', 'e', 'f'])

  assert.deepEqual(kept, [0, 4, 1, 2, 3])
}

function testCadenceChain() {
  assert.equal(nextLensCadence('year'), 'quarter')
  assert.equal(nextLensCadence('quarter'), 'month')
  assert.equal(nextLensCadence('month'), 'week')
  assert.equal(nextLensCadence('week'), null)
}

function testDescentValidation() {
  assert.deepEqual(
    validateDescentInput({
      parentGoalId: null,
      parentCadence: 'year',
      requestedCadence: 'quarter',
      status: 'locked',
      options: ['q1'],
      keptIndexes: [0],
    }),
    { ok: false, error: 'Lower-level goals need a parent goal.' },
  )

  assert.deepEqual(
    validateDescentInput({
      parentGoalId: 'goal_1',
      parentCadence: 'year',
      requestedCadence: 'month',
      status: 'locked',
      options: ['m1'],
      keptIndexes: [0],
    }),
    { ok: false, error: 'This goal cannot be descended at that level.' },
  )

  assert.deepEqual(
    validateDescentInput({
      parentGoalId: 'goal_1',
      parentCadence: 'year',
      requestedCadence: 'quarter',
      status: 'locked',
      options: [],
      keptIndexes: [],
    }),
    { ok: false, error: 'Keep at least one child goal, or park this descent for now.' },
  )

  assert.deepEqual(
    validateDescentInput({
      parentGoalId: 'goal_1',
      parentCadence: 'year',
      requestedCadence: 'quarter',
      status: 'parked',
      options: [],
      keptIndexes: [],
    }),
    { ok: true },
  )
}

function testAlignmentFallback() {
  assert.equal(normalizeLensAlignmentType('maintenance'), 'maintenance')
  assert.equal(normalizeLensAlignmentType('mystery'), 'progress')
}

testOptionCaps()
testKeptCapsAndDedupe()
testCadenceChain()
testDescentValidation()
testAlignmentFallback()

console.log('lenses workshop: caps, cadence, and descent validation OK')

