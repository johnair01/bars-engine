/**
 * Book launch paywall — unit tests (DB-free).
 * Run: npx tsx src/lib/__tests__/book-launch-paywall.test.ts
 *
 * Covers the deterministic mock branch of verifyLicense and the pure parts of
 * book-access. Live Gumroad + DB-backed entitlement checks are exercised by the
 * verification quest (cert-book-launch-paywall-v1), not here.
 */
import assert from 'node:assert/strict'

process.env.GUMROAD_VERIFY_MODE = 'mock'

import { verifyLicense } from '../gumroad'
import { isFreeChapter, hasBookAccess, FREE_CHAPTER_IDS } from '../book-access'

async function testVerifyMock() {
  const good = await verifyLicense('TEST-abc-123')
  assert.ok(good.ok, 'TEST- key verifies')
  if (good.ok) assert.equal(good.refunded, false)

  const refunded = await verifyLicense('REFUND-xyz')
  assert.equal(refunded.ok, false, 'REFUND- key rejected')
  if (!refunded.ok) assert.equal(refunded.reason, 'refunded')

  const bogus = await verifyLicense('whatever')
  assert.equal(bogus.ok, false, 'unknown key invalid')
  if (!bogus.ok) assert.equal(bogus.reason, 'invalid')

  const empty = await verifyLicense('   ')
  assert.equal(empty.ok, false, 'empty key invalid')
  if (!empty.ok) assert.equal(empty.reason, 'invalid')
}

async function testFreeChapterAndAccess() {
  assert.ok(isFreeChapter('front-of-book'), 'Prologue is free')
  assert.ok(FREE_CHAPTER_IDS.includes('front-of-book'), 'front-of-book in free set')
  assert.equal(isFreeChapter('chapter-one'), false, 'other chapters are not free')

  // Logged-out reader has no access (short-circuits before any DB query).
  assert.equal(await hasBookAccess(null), false, 'no player → no access')
}

async function run() {
  await testVerifyMock()
  await testFreeChapterAndAccess()
  console.log('✓ book-launch-paywall unit tests OK')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
