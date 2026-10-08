/**
 * Run: npx tsx src/lib/tap-the-vein/__tests__/charge.test.ts
 *
 * Covers the tolerant parsing on the charge/blocker slice. The columns are
 * nullable TEXT/JSONB added to a table with existing rows, so every helper has
 * to survive the pre-migration shape.
 */

import {
  blockedDays,
  normalizeChargeLevel,
  parseBrainstormCandidates,
} from '@/lib/tap-the-vein/charge'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function run() {
  // ── normalizeChargeLevel ──────────────────────────────────────────────────
  assert(normalizeChargeLevel('high') === 'high', 'accepts high')
  assert(normalizeChargeLevel('medium') === 'medium', 'accepts medium')
  assert(normalizeChargeLevel('low') === 'low', 'accepts low')
  // Rows written before the column exists read as null, not as a default level —
  // "not yet assessed" must stay distinguishable from "low".
  assert(normalizeChargeLevel(null) === null, 'null stays null')
  assert(normalizeChargeLevel(undefined) === null, 'undefined stays null')
  assert(normalizeChargeLevel('') === null, 'empty string stays null')
  assert(normalizeChargeLevel('HIGH') === null, 'case-sensitive — no silent coercion')
  assert(normalizeChargeLevel('urgent') === null, 'unknown level rejected')

  // ── parseBrainstormCandidates ─────────────────────────────────────────────
  assert(parseBrainstormCandidates(null).length === 0, 'null blob → empty')
  assert(parseBrainstormCandidates(undefined).length === 0, 'undefined blob → empty')
  assert(parseBrainstormCandidates('not an array').length === 0, 'string blob → empty')
  assert(parseBrainstormCandidates({ text: 'x' }).length === 0, 'object blob → empty')

  const parsed = parseBrainstormCandidates([
    { text: '  call the landlord  ', fate: 'play' },
    { text: 'draft the email', fate: 'composted' },
    { text: 'no fate given' },
    { text: 'bogus fate', fate: 'whatever' },
    { text: '   ' },
    { text: 42 },
    null,
    'raw string',
  ])
  assert(parsed.length === 4, `keeps only well-formed rows (got ${parsed.length})`)
  assert(parsed[0].text === 'call the landlord', 'trims text')
  assert(parsed[0].fate === 'play', 'keeps play')
  assert(parsed[1].fate === 'composted', 'keeps composted')
  assert(parsed[2].fate === 'raw', 'missing fate defaults to raw')
  assert(parsed[3].fate === 'raw', 'unknown fate defaults to raw')

  // Round-trips what the UI sends.
  const roundTrip = parseBrainstormCandidates(
    parseBrainstormCandidates([{ text: 'a', fate: 'play' }])
  )
  assert(roundTrip.length === 1 && roundTrip[0].fate === 'play', 'round-trips')

  // ── blockedDays ───────────────────────────────────────────────────────────
  const now = new Date('2026-08-13T12:00:00Z')
  assert(blockedDays(null, now) === 0, 'not blocked → 0')
  assert(blockedDays(undefined, now) === 0, 'undefined → 0')
  assert(blockedDays('nonsense', now) === 0, 'unparseable date → 0')
  assert(blockedDays('2026-08-13T09:00:00Z', now) === 0, 'same day → 0')
  assert(blockedDays('2026-08-10T12:00:00Z', now) === 3, 'three days')
  assert(blockedDays(new Date('2026-08-10T12:00:00Z'), now) === 3, 'accepts a Date')
  // A clock skew that puts the block in the future must not render as negative.
  assert(blockedDays('2026-08-20T12:00:00Z', now) === 0, 'future date clamps to 0')

  console.log('tap-the-vein charge tests passed')
}

run()
