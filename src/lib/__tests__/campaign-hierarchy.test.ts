/**
 * Run: npx tsx src/lib/__tests__/campaign-hierarchy.test.ts
 */
import {
  HARD_CAMPAIGN_TREE_DEPTH,
  wouldAssignParentCreateCycle,
} from '@/lib/campaign-hierarchy'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  assert(
    wouldAssignParentCreateCycle('c', 'c', []) === true,
    'self-parent is cycle'
  )
  assert(
    wouldAssignParentCreateCycle('c', 'p', ['c', 'root']) === true,
    'parent chain containing campaign id is cycle'
  )
  assert(
    wouldAssignParentCreateCycle('c', 'p', ['p', 'root']) === false,
    'normal parent assignment'
  )
  assert(
    wouldAssignParentCreateCycle(undefined, 'p', ['p']) === false,
    'create child has no campaign id yet'
  )
  assert(HARD_CAMPAIGN_TREE_DEPTH === 10, 'hard depth matches recursive-nesting spec cap')

  console.log('campaign-hierarchy tests OK')
}

run()
