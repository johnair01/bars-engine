/**
 * Milestone needs — tiered matching + per-unit progress (campaign Phase 3 FR9/10).
 * Run: npx tsx src/lib/superpowers/__tests__/needs.test.ts
 */
import assert from 'node:assert/strict'
import {
  matchNeedsForPlayer,
  summarizeNeeds,
  type MilestoneNeed,
} from '../needs'

function need(p: Partial<MilestoneNeed> & Pick<MilestoneNeed, 'id' | 'superpower' | 'orientation'>): MilestoneNeed {
  return {
    milestoneId: 'm1',
    cardId: 'OPEN-GR-SHAMAN',
    unit: 'action',
    value: 1,
    status: 'open',
    ...p,
  }
}

const NEEDS: MilestoneNeed[] = [
  need({ id: 'n1', superpower: 'connector', orientation: 'external' }),
  need({ id: 'n2', superpower: 'connector', orientation: 'internal' }),
  need({ id: 'n3', superpower: 'strategist', orientation: 'external' }),
  need({ id: 'n4', superpower: 'connector', orientation: 'external', status: 'claimed' }),
  need({ id: 'n5', superpower: 'alchemist', orientation: 'external', status: 'done' }),
]

function testTier1MatchesSuperpowerAndOrientation() {
  const tiered = matchNeedsForPlayer(NEEDS, { superpower: 'connector', orientation: 'external' })
  const matched = tiered.filter((t) => t.tier === 'matched').map((t) => t.need.id)
  assert.deepEqual(matched, ['n1'], 'only open connector/external is matched')
}

function testFallbackTier2GetsTheRest() {
  const tiered = matchNeedsForPlayer(NEEDS, { superpower: 'connector', orientation: 'external' })
  const open = tiered.filter((t) => t.tier === 'open').map((t) => t.need.id)
  // n2 (connector/internal) + n3 (strategist) are open but not matched
  assert.deepEqual(open.sort(), ['n2', 'n3'], 'unmatched open needs fall to Tier 2')
}

function testClaimedAndDoneExcluded() {
  const tiered = matchNeedsForPlayer(NEEDS, { superpower: 'connector', orientation: 'external' })
  const ids = tiered.map((t) => t.need.id)
  assert.ok(!ids.includes('n4'), 'claimed excluded')
  assert.ok(!ids.includes('n5'), 'done excluded')
}

function testMatchedComeFirst() {
  const tiered = matchNeedsForPlayer(NEEDS, { superpower: 'connector', orientation: 'external' })
  assert.equal(tiered[0].tier, 'matched', 'matched ordered before open')
}

function testNullOrientationMatchesOnSuperpowerAlone() {
  const tiered = matchNeedsForPlayer(NEEDS, { superpower: 'connector', orientation: null })
  const matched = tiered.filter((t) => t.tier === 'matched').map((t) => t.need.id).sort()
  assert.deepEqual(matched, ['n1', 'n2'], 'both connector needs match when orientation is null')
}

function testSummarizePerUnitAndOrientationSplit() {
  const mixed: MilestoneNeed[] = [
    need({ id: 'a', superpower: 'strategist', orientation: 'external', unit: 'currency', value: 100, status: 'done' }),
    need({ id: 'b', superpower: 'strategist', orientation: 'external', unit: 'currency', value: 300 }),
    need({ id: 'c', superpower: 'coach', orientation: 'external', unit: 'hours', value: 5, status: 'done' }),
    need({ id: 'd', superpower: 'alchemist', orientation: 'internal', unit: 'action', value: 1, status: 'done' }),
    need({ id: 'e', superpower: 'alchemist', orientation: 'internal', unit: 'action', value: 1 }),
  ]
  const p = summarizeNeeds(mixed)

  const extCurrency = p.external.find((u) => u.unit === 'currency')!
  assert.deepEqual({ done: extCurrency.done, total: extCurrency.total }, { done: 100, total: 400 })
  const extHours = p.external.find((u) => u.unit === 'hours')!
  assert.deepEqual({ done: extHours.done, total: extHours.total }, { done: 5, total: 5 })
  // currency and hours are NOT blended into one number
  assert.equal(p.external.length, 2, 'external keeps currency and hours as separate sub-bars')

  const intAction = p.internal.find((u) => u.unit === 'action')!
  assert.deepEqual({ done: intAction.done, total: intAction.total }, { done: 1, total: 2 })
  // internal tracked separately from external
  assert.ok(!p.external.some((u) => u.unit === 'action'), 'internal action not mixed into external')
}

const tests = [
  testTier1MatchesSuperpowerAndOrientation,
  testFallbackTier2GetsTheRest,
  testClaimedAndDoneExcluded,
  testMatchedComeFirst,
  testNullOrientationMatchesOnSuperpowerAlone,
  testSummarizePerUnitAndOrientationSplit,
]

let passed = 0
for (const t of tests) {
  t()
  passed += 1
}
console.log(`✓ milestone needs: ${passed}/${tests.length} tests passed`)
