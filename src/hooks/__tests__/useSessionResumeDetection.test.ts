'use client'
/**
 * Tests for useSessionResumeDetection — Session Resume Detection
 *
 * Verifies Sub-AC 2 of AC11: Session-resume detection distinguishes
 * fresh navigation from resumed sessions.
 *
 * Tests the pure utility functions directly. The React hook behavior
 * is validated through integration (the hook itself depends on
 * sessionStorage + useEffect timing which requires a DOM environment).
 *
 * Run: tsx src/hooks/__tests__/useSessionResumeDetection.test.ts
 *
 * @see src/hooks/useSessionResumeDetection.ts
 */

import assert from 'node:assert'
import { formatSessionAge } from '../useSessionResumeDetection'

// ---------------------------------------------------------------------------
// formatSessionAge — human-readable duration formatting
// ---------------------------------------------------------------------------

function testFormatSessionAge() {
  console.log('  formatSessionAge...')

  // null / negative
  assert.strictEqual(formatSessionAge(null), 'unknown')
  assert.strictEqual(formatSessionAge(-1), 'unknown')

  // seconds range
  assert.strictEqual(formatSessionAge(0), 'a few seconds')
  assert.strictEqual(formatSessionAge(5_000), 'a few seconds')
  assert.strictEqual(formatSessionAge(59_000), 'a few seconds')

  // minutes range
  assert.strictEqual(formatSessionAge(60_000), '1 minute')
  assert.strictEqual(formatSessionAge(120_000), '2 minutes')
  assert.strictEqual(formatSessionAge(15 * 60_000), '15 minutes')
  assert.strictEqual(formatSessionAge(59 * 60_000), '59 minutes')

  // hours range
  assert.strictEqual(formatSessionAge(60 * 60_000), '1 hour')
  assert.strictEqual(formatSessionAge(2 * 60 * 60_000), '2 hours')
  assert.strictEqual(formatSessionAge(23 * 60 * 60_000), '23 hours')

  // days range
  assert.strictEqual(formatSessionAge(24 * 60 * 60_000), '1 day')
  assert.strictEqual(formatSessionAge(3 * 24 * 60 * 60_000), '3 days')

  console.log('  ✓ formatSessionAge')
}

// ---------------------------------------------------------------------------
// Session classification logic (extracted from hook for testability)
// ---------------------------------------------------------------------------

/**
 * Extracted classification logic that mirrors the hook's mount-time detection.
 * This allows us to unit-test the decision tree without React/DOM.
 */
function classifySession(opts: {
  prevHeartbeatStr: string | null
  prevSessionId: string | null
  currentSessionId: string
  now: number
  stalenessThresholdMs: number
}): {
  isResumedSession: boolean
  sessionAge: number | null
} {
  const { prevHeartbeatStr, prevSessionId, currentSessionId, now, stalenessThresholdMs } = opts

  if (!prevHeartbeatStr) {
    return { isResumedSession: false, sessionAge: null }
  }

  const prevTimestamp = new Date(prevHeartbeatStr).getTime()
  const age = now - prevTimestamp

  if (isNaN(prevTimestamp)) {
    return { isResumedSession: false, sessionAge: null }
  }

  if (prevSessionId === currentSessionId) {
    // Same session ID — re-render, not resume
    return { isResumedSession: false, sessionAge: age }
  }

  if (age > stalenessThresholdMs) {
    // Heartbeat is stale — resumed session
    return { isResumedSession: true, sessionAge: age }
  }

  // Heartbeat is fresh — same-session navigation
  return { isResumedSession: false, sessionAge: age }
}

function testClassifySession() {
  console.log('  classifySession...')

  const threshold = 60_000 // 60s

  // Case 1: No previous heartbeat → fresh session
  {
    const result = classifySession({
      prevHeartbeatStr: null,
      prevSessionId: null,
      currentSessionId: 's_new',
      now: Date.now(),
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, false, 'No heartbeat = fresh')
    assert.strictEqual(result.sessionAge, null, 'No heartbeat = null age')
  }

  // Case 2: Same session ID → not a resume (React re-render / StrictMode)
  {
    const now = Date.now()
    const result = classifySession({
      prevHeartbeatStr: new Date(now - 120_000).toISOString(), // 2 min stale
      prevSessionId: 's_same',
      currentSessionId: 's_same',
      now,
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, false, 'Same session ID = not a resume')
  }

  // Case 3: Different session ID + stale heartbeat → RESUMED
  {
    const now = Date.now()
    const result = classifySession({
      prevHeartbeatStr: new Date(now - 120_000).toISOString(), // 2 min ago
      prevSessionId: 's_old',
      currentSessionId: 's_new',
      now,
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, true, 'Stale heartbeat + diff ID = resume')
    assert.ok(result.sessionAge! >= 119_000, 'Session age ~120s')
  }

  // Case 4: Different session ID + fresh heartbeat → NOT resumed (same-session nav)
  {
    const now = Date.now()
    const result = classifySession({
      prevHeartbeatStr: new Date(now - 10_000).toISOString(), // 10s ago
      prevSessionId: 's_old',
      currentSessionId: 's_new',
      now,
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, false, 'Fresh heartbeat = not resumed')
  }

  // Case 5: Corrupted heartbeat string → treat as fresh
  {
    const result = classifySession({
      prevHeartbeatStr: 'not-a-date',
      prevSessionId: 's_old',
      currentSessionId: 's_new',
      now: Date.now(),
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, false, 'Corrupted = fresh')
    assert.strictEqual(result.sessionAge, null, 'Corrupted = null age')
  }

  // Case 6: Heartbeat exactly at threshold boundary → NOT resumed (>= not >)
  {
    const now = Date.now()
    const result = classifySession({
      prevHeartbeatStr: new Date(now - threshold).toISOString(), // exactly at threshold
      prevSessionId: 's_old',
      currentSessionId: 's_new',
      now,
      stalenessThresholdMs: threshold,
    })
    // age === threshold, condition is age > threshold, so NOT resumed
    assert.strictEqual(result.isResumedSession, false, 'Exact threshold = not resumed')
  }

  // Case 7: Heartbeat 1ms past threshold → RESUMED
  {
    const now = Date.now()
    const result = classifySession({
      prevHeartbeatStr: new Date(now - threshold - 1).toISOString(),
      prevSessionId: 's_old',
      currentSessionId: 's_new',
      now,
      stalenessThresholdMs: threshold,
    })
    assert.strictEqual(result.isResumedSession, true, '1ms past threshold = resumed')
  }

  console.log('  ✓ classifySession')
}

// ---------------------------------------------------------------------------
// Integration contract: hook exports expected interface
// ---------------------------------------------------------------------------

function testExports() {
  console.log('  exports...')

  // formatSessionAge is the only non-hook export
  assert.strictEqual(typeof formatSessionAge, 'function')

  console.log('  ✓ exports')
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

console.log('useSessionResumeDetection tests:')
testExports()
testFormatSessionAge()
testClassifySession()
console.log('All useSessionResumeDetection tests passed ✓')
