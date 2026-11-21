import assert from 'node:assert/strict'
import {
  ACTIVE_TTV_TASK_STATUSES,
  canCommitTtvTask,
  nextHistoricalPriorityRank,
} from '@/lib/tap-the-vein/commit-policy'

function testActiveStatuses() {
  assert.deepEqual(ACTIVE_TTV_TASK_STATUSES, ['committed', 'in_progress'])
}

function testFiveTaskCap() {
  assert.equal(canCommitTtvTask(0), true)
  assert.equal(canCommitTtvTask(4), true)
  assert.equal(canCommitTtvTask(5), false)
  assert.equal(canCommitTtvTask(6), false)
}

function testHistoricalRanksDoNotReuse() {
  assert.equal(nextHistoricalPriorityRank(null), 1)
  assert.equal(nextHistoricalPriorityRank(undefined), 1)
  assert.equal(nextHistoricalPriorityRank(5), 6)
}

testActiveStatuses()
testFiveTaskCap()
testHistoricalRanksDoNotReuse()

console.log('tap the vein commit policy: cap and historical rank behavior OK')


import { isAlreadyLiveToday, sameTaskWords } from '@/lib/tap-the-vein/commit-policy'

function testSameWordsIgnoreCaseAndSpacing() {
  assert.equal(sameTaskWords('SEnd Dan a Copy of the Book', ' send dan  a copy of the book '), true)
  assert.equal(sameTaskWords('Call my mom', 'Call my dad'), false)
  assert.equal(isAlreadyLiveToday(['Call my mom'], 'call my mom'), true)
  assert.equal(isAlreadyLiveToday([], 'call my mom'), false)
}
testSameWordsIgnoreCaseAndSpacing()
