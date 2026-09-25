/**
 * The cadence rule, tested as a result.
 *
 * "Does buildLogState return 'lapsed'" is the mechanism. "Can the page keep
 * selling a weekly subscription three months after the last post" is the
 * result, and the result is the one the handoff cares about.
 */
import assert from 'node:assert/strict'
import {
  buildLogState,
  daysInWords,
  WEEKLY_GRACE_DAYS,
  type BuildLogPost,
} from '../posts'

const post = (date: string, title = 'A week of work'): BuildLogPost => ({ date, title })

// ── Nothing posted ───────────────────────────────────────────────────────────

assert.deepEqual(
  buildLogState([], '2026-08-11'),
  { kind: 'unstarted' },
  'an empty log is unstarted, not lapsed — there is no broken promise yet',
)

// ── The cadence holding ──────────────────────────────────────────────────────

{
  const state = buildLogState([post('2026-08-09')], '2026-08-11')
  assert.equal(state.kind, 'holding')
  assert.equal(state.daysSinceLast, 2)
}

// Exactly on the grace boundary still counts as kept.
assert.equal(
  buildLogState([post('2026-08-01')], '2026-08-11').kind,
  'holding',
  `${WEEKLY_GRACE_DAYS} days is inside the grace`,
)

// ── The cadence lapsed ───────────────────────────────────────────────────────

assert.equal(
  buildLogState([post('2026-07-31')], '2026-08-11').kind,
  'lapsed',
  'one day past the grace is lapsed',
)

// The case the handoff is actually worried about.
{
  const state = buildLogState([post('2026-04-02')], '2026-08-11')
  assert.equal(state.kind, 'lapsed', 'four months of silence must read as lapsed')
  assert.equal(state.daysSinceLast, 131)
}

// ── Ordering ─────────────────────────────────────────────────────────────────

// The newest post decides, whatever order the array happens to be in.
{
  const state = buildLogState(
    [post('2026-06-01'), post('2026-08-10', 'The newest'), post('2026-07-04')],
    '2026-08-11',
  )
  assert.equal(state.kind, 'holding')
  assert.equal(state.latest.title, 'The newest')
  assert.equal(state.postCount, 3)
}

// A post dated in the future does not produce a negative age.
{
  const state = buildLogState([post('2026-09-01')], '2026-08-11')
  assert.equal(state.kind, 'holding')
  assert.equal(state.daysSinceLast, 0)
}

// ── Prose helper ─────────────────────────────────────────────────────────────

assert.equal(daysInWords(2), 'two')
assert.equal(daysInWords(11), 'eleven')
assert.equal(daysInWords(131), '131', 'past the table it falls back to numerals')

console.log('✓ build-log: unstarted, holding and lapsed all resolve correctly')
