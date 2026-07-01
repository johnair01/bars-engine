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

