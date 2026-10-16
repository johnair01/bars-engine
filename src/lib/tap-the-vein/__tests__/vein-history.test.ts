/**
 * Run: npx tsx src/lib/tap-the-vein/__tests__/vein-history.test.ts
 *
 * The vein history export (pass ttv-loop 1): free writes verbatim, oldest first,
 * empty days dropped, each seed's BAR maturity read, composted BARs named.
 */

import { parseSince, seedMaturity, toVeinHistory, type VeinSessionRow } from '@/lib/tap-the-vein/vein-history'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

const now = new Date('2026-10-16T12:00:00.000Z')

const task = (id: string, extra: Partial<VeinSessionRow['tasks'][number]> = {}): VeinSessionRow['tasks'][number] => ({
  id,
  originalText: `task ${id}`,
  status: 'committed',
  lensGoalId: null,
  barId: null,
  questId: null,
  chargeLevel: null,
  blockedAt: null,
  carryCount: 0,
  completedAt: null,
  compostReason: null,
  ...extra,
})

const sessions: VeinSessionRow[] = [
  {
    sessionDate: new Date('2026-10-14T00:00:00.000Z'),
    status: 'sealed',
    sealedAt: new Date('2026-10-14T15:00:00.000Z'),
    rawEntry: 'I want the book out by spring.\nAnd a body that can carry it.',
    wordCount: 13,
    lensCategory: 'career',
    tasks: [task('a', { barId: 'bar-a' }), task('b', { barId: 'bar-b', blockedAt: new Date() }), task('c')],
  },
  {
    sessionDate: new Date('2026-10-12T00:00:00.000Z'),
    status: 'open',
    sealedAt: null,
    rawEntry: 'Earlier day.',
    wordCount: 2,
    lensCategory: null,
    tasks: [],
  },
  { sessionDate: new Date('2026-10-13T00:00:00.000Z'), status: 'abandoned', sealedAt: null, rawEntry: '  ', wordCount: 0, lensCategory: null, tasks: [] },
]

const bars = [
  { id: 'bar-a', seedMetabolization: JSON.stringify({ maturity: 'elaborated' }), archivedAt: null },
  { id: 'bar-b', seedMetabolization: null, archivedAt: new Date() },
]

function run() {
  const out = toVeinHistory(sessions, bars, new Date('2026-07-18T00:00:00.000Z'), now)
  assert(out.version === 1, 'version 1')
  assert(out.since === '2026-07-18', 'since is a date')
  assert(out.days.length === 2, 'the empty day is dropped')
  assert(out.days[0].date === '2026-10-12' && out.days[1].date === '2026-10-14', 'oldest first')
  assert(out.days[1].freewrite === sessions[0].rawEntry, 'free write verbatim')
  assert(out.days[1].lensDomain === 'career', 'lens domain carried')
  const [a, b, c] = out.days[1].seeds
  assert(a.maturity === 'elaborated', 'maturity read from the BAR')
  assert(b.maturity === 'composted' && b.blocked, 'archived BAR reads as composted; blocked flag')
  assert(c.maturity === null, 'a task with no BAR has no maturity')
  assert(seedMaturity({ id: 'x', seedMetabolization: null, archivedAt: null }) === 'captured', 'default maturity is captured')

  assert(parseSince(null, now)?.toISOString().slice(0, 10) === '2026-07-18', 'default window is 90 days')
  assert(parseSince('2026-10-01', now)?.toISOString().slice(0, 10) === '2026-10-01', 'explicit since')
  assert(parseSince('2020-01-01', now)?.toISOString().slice(0, 10) === '2025-10-15', 'capped at 366 days')
  assert(parseSince('10/01/2026', now) === null, 'malformed since is refused')
  console.log('vein-history: all assertions passed')
}

run()
