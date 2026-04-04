/**
 * Campaign lifecycle state machine — pure unit tests (no DB).
 *
 * Validates the DRAFT → PENDING_REVIEW → APPROVED → LIVE flow is enforced,
 * and that direct publish (DRAFT → LIVE) is impossible.
 */
import assert from 'node:assert/strict'
import {
  validateTransition,
  validateEdit,
  validateDelete,
  getAvailableTransitions,
  onTransition,
  fireLifecycleHooks,
  isPubliclyVisible,
  isActive,
  STATUS_LABELS,
} from '@/lib/campaign-lifecycle'
import type { CampaignStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

function testValidTransitions() {
  // DRAFT → PENDING_REVIEW (steward+ submits)
  const t1 = validateTransition('DRAFT', 'PENDING_REVIEW')
  assert.equal(t1.valid, true)
  if (t1.valid) assert.equal(t1.requiredRole, 'steward+')

  // PENDING_REVIEW → APPROVED (admin approves)
  const t2 = validateTransition('PENDING_REVIEW', 'APPROVED')
  assert.equal(t2.valid, true)
  if (t2.valid) assert.equal(t2.requiredRole, 'admin')

  // PENDING_REVIEW → REJECTED (admin rejects)
  const t3 = validateTransition('PENDING_REVIEW', 'REJECTED')
  assert.equal(t3.valid, true)
  if (t3.valid) assert.equal(t3.requiredRole, 'admin')

  // REJECTED → PENDING_REVIEW (steward+ re-submits)
  const t4 = validateTransition('REJECTED', 'PENDING_REVIEW')
  assert.equal(t4.valid, true)
  if (t4.valid) assert.equal(t4.requiredRole, 'steward+')

  // APPROVED → LIVE (admin launches)
  const t5 = validateTransition('APPROVED', 'LIVE')
  assert.equal(t5.valid, true)
  if (t5.valid) assert.equal(t5.requiredRole, 'admin')

  // LIVE → ARCHIVED (steward+ archives)
  const t6 = validateTransition('LIVE', 'ARCHIVED')
  assert.equal(t6.valid, true)
  if (t6.valid) assert.equal(t6.requiredRole, 'steward+')

  console.log('  valid transitions: OK')
}

// ---------------------------------------------------------------------------
// Blocked transitions — direct publish prevention
// ---------------------------------------------------------------------------

function testBlockedTransitions() {
  // DRAFT → LIVE is the critical illegal path
  const t1 = validateTransition('DRAFT', 'LIVE')
  assert.equal(t1.valid, false)
  if (!t1.valid) assert.match(t1.reason, /Cannot transition/)

  // DRAFT → APPROVED (skip review)
  const t2 = validateTransition('DRAFT', 'APPROVED')
  assert.equal(t2.valid, false)

  // REJECTED → LIVE (skip re-review)
  const t3 = validateTransition('REJECTED', 'LIVE')
  assert.equal(t3.valid, false)

  // REJECTED → APPROVED (skip re-review)
  const t4 = validateTransition('REJECTED', 'APPROVED')
  assert.equal(t4.valid, false)

  // APPROVED → PENDING_REVIEW (backwards)
  const t5 = validateTransition('APPROVED', 'PENDING_REVIEW')
  assert.equal(t5.valid, false)

  // LIVE → DRAFT (backwards)
  const t6 = validateTransition('LIVE', 'DRAFT')
  assert.equal(t6.valid, false)

  // LIVE → APPROVED (backwards)
  const t7 = validateTransition('LIVE', 'APPROVED')
  assert.equal(t7.valid, false)

  // ARCHIVED → anything (terminal state for now)
  const t8 = validateTransition('ARCHIVED', 'LIVE')
  assert.equal(t8.valid, false)
  const t9 = validateTransition('ARCHIVED', 'DRAFT')
  assert.equal(t9.valid, false)

  // Self-transition
  const t10 = validateTransition('DRAFT', 'DRAFT')
  assert.equal(t10.valid, false)
  if (!t10.valid) assert.match(t10.reason, /already/)

  console.log('  blocked transitions: OK')
}

// ---------------------------------------------------------------------------
// Edit guards
// ---------------------------------------------------------------------------

function testEditGuards() {
  // Editable: DRAFT, REJECTED
  assert.equal(validateEdit('DRAFT').valid, true)
  assert.equal(validateEdit('REJECTED').valid, true)

  // Not editable: everything else
  assert.equal(validateEdit('PENDING_REVIEW').valid, false)
  assert.equal(validateEdit('APPROVED').valid, false)
  assert.equal(validateEdit('LIVE').valid, false)
  assert.equal(validateEdit('ARCHIVED').valid, false)

  console.log('  edit guards: OK')
}

// ---------------------------------------------------------------------------
// Delete guards
// ---------------------------------------------------------------------------

function testDeleteGuards() {
  // Deletable: DRAFT only
  assert.equal(validateDelete('DRAFT').valid, true)

  // Not deletable: everything else
  assert.equal(validateDelete('REJECTED').valid, false)
  assert.equal(validateDelete('PENDING_REVIEW').valid, false)
  assert.equal(validateDelete('APPROVED').valid, false)
  assert.equal(validateDelete('LIVE').valid, false)
  assert.equal(validateDelete('ARCHIVED').valid, false)

  console.log('  delete guards: OK')
}

// ---------------------------------------------------------------------------
// Available transitions
// ---------------------------------------------------------------------------

function testAvailableTransitions() {
  const fromDraft = getAvailableTransitions('DRAFT')
  assert.equal(fromDraft.length, 1)
  assert.equal(fromDraft[0].status, 'PENDING_REVIEW')

  const fromPending = getAvailableTransitions('PENDING_REVIEW')
  const pendingTargets = fromPending.map((t) => t.status).sort()
  assert.deepEqual(pendingTargets, ['APPROVED', 'REJECTED'])

  const fromApproved = getAvailableTransitions('APPROVED')
  assert.equal(fromApproved.length, 1)
  assert.equal(fromApproved[0].status, 'LIVE')

  const fromLive = getAvailableTransitions('LIVE')
  assert.equal(fromLive.length, 1)
  assert.equal(fromLive[0].status, 'ARCHIVED')

  const fromArchived = getAvailableTransitions('ARCHIVED')
  assert.equal(fromArchived.length, 0)

  const fromRejected = getAvailableTransitions('REJECTED')
  assert.equal(fromRejected.length, 1)
  assert.equal(fromRejected[0].status, 'PENDING_REVIEW')

  console.log('  available transitions: OK')
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

async function testLifecycleHooks() {
  const events: string[] = []

  const unregister = onTransition('LIVE', async (event) => {
    events.push(`${event.from}→${event.to}:${event.campaignId}`)
  })

  // Fire a LIVE hook
  await fireLifecycleHooks({
    campaignId: 'test-123',
    from: 'APPROVED',
    to: 'LIVE',
    actorId: 'player-1',
    timestamp: new Date(),
  })

  assert.equal(events.length, 1)
  assert.equal(events[0], 'APPROVED→LIVE:test-123')

  // Fire a non-LIVE hook — should not trigger
  await fireLifecycleHooks({
    campaignId: 'test-456',
    from: 'DRAFT',
    to: 'PENDING_REVIEW',
    actorId: 'player-2',
    timestamp: new Date(),
  })
  assert.equal(events.length, 1)

  // Unregister and fire again — should not trigger
  unregister()
  await fireLifecycleHooks({
    campaignId: 'test-789',
    from: 'APPROVED',
    to: 'LIVE',
    actorId: 'player-3',
    timestamp: new Date(),
  })
  assert.equal(events.length, 1)

  console.log('  lifecycle hooks: OK')
}

// ---------------------------------------------------------------------------
// Hook error isolation — one failing hook doesn't break others
// ---------------------------------------------------------------------------

async function testHookErrorIsolation() {
  const events: string[] = []

  const unsub1 = onTransition('APPROVED', async () => {
    throw new Error('Boom!')
  })
  const unsub2 = onTransition('APPROVED', async (event) => {
    events.push(`ok:${event.campaignId}`)
  })

  // Should not throw even though first hook errors
  await fireLifecycleHooks({
    campaignId: 'test-err',
    from: 'PENDING_REVIEW',
    to: 'APPROVED',
    actorId: 'admin-1',
    timestamp: new Date(),
  })

  // Second hook still fired
  assert.equal(events.length, 1)
  assert.equal(events[0], 'ok:test-err')

  unsub1()
  unsub2()
  console.log('  hook error isolation: OK')
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function testStatusHelpers() {
  assert.equal(isPubliclyVisible('LIVE'), true)
  assert.equal(isPubliclyVisible('DRAFT'), false)
  assert.equal(isPubliclyVisible('APPROVED'), false)

  assert.equal(isActive('DRAFT'), true)
  assert.equal(isActive('LIVE'), true)
  assert.equal(isActive('ARCHIVED'), false)

  // All statuses have labels
  const allStatuses: CampaignStatus[] = [
    'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'LIVE', 'ARCHIVED',
  ]
  for (const s of allStatuses) {
    assert.ok(STATUS_LABELS[s], `Missing label for ${s}`)
  }

  console.log('  status helpers: OK')
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------

async function runAll() {
  console.log('campaign-lifecycle:')
  testValidTransitions()
  testBlockedTransitions()
  testEditGuards()
  testDeleteGuards()
  testAvailableTransitions()
  await testLifecycleHooks()
  await testHookErrorIsolation()
  testStatusHelpers()
  console.log('campaign-lifecycle: ALL PASSED')
}

runAll().catch((err) => {
  console.error(err)
  process.exit(1)
})
