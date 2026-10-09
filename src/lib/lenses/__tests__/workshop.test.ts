import assert from 'node:assert/strict'
import {
  cleanLensKeptIndexes,
  cleanLensOptions,
  lensGoalEditData,
  nextLensCadence,
  nextUnvisitedDomain,
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

function testGoalEdits() {
  assert.deepEqual(lensGoalEditData('rename', '  Ship the book  '), { data: { title: 'Ship the book' } })
  assert.deepEqual(lensGoalEditData('rename', '   '), { error: 'A goal needs a name.' })
  assert.deepEqual(lensGoalEditData('park'), { data: { status: 'parked' } })
  assert.deepEqual(lensGoalEditData('resume'), { data: { status: 'active' } })
  const retire = lensGoalEditData('retire')
  assert.ok('data' in retire && 'status' in retire.data && retire.data.status === 'archived')
}

function testNextUnvisitedDomain() {
  const keys = ['relationships', 'career', 'money', 'health', 'allyship']
  assert.equal(nextUnvisitedDomain(keys, [], []), 'relationships')
  // two domains locked, then the tab closes: the third comes up next morning
  const drafts = [
    { domain: 'relationships', status: 'locked' },
    { domain: 'career', status: 'locked' },
  ]
  assert.equal(nextUnvisitedDomain(keys, drafts, []), 'money')
  assert.equal(nextUnvisitedDomain(keys, [{ domain: 'money', status: 'draft' }], [{ domain: 'relationships', status: 'active' }]), 'career')
  assert.equal(nextUnvisitedDomain(keys, keys.map((domain) => ({ domain, status: 'locked' })), []), null)
}

testOptionCaps()
testKeptCapsAndDedupe()
testCadenceChain()
testDescentValidation()
testAlignmentFallback()
testGoalEdits()
testNextUnvisitedDomain()

console.log('lenses workshop: caps, cadence, descent validation, goal edits, morning domain OK')

