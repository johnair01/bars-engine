import assert from 'node:assert/strict'
import {
  addDays,
  drawNote,
  isOutOfDay,
  keepNote,
  libraryDays,
  restNote,
  RESTABLE_STATUSES,
  resurfacedToday,
  resurfacing,
  toSeedLibrary,
} from '@/lib/tap-the-vein/seed-library'

function testRestingIsOutOfTheDay() {
  assert.equal(isOutOfDay('resting'), true)
  assert.equal(isOutOfDay('carried_over'), true)
  assert.equal(isOutOfDay('composted'), true)
  assert.equal(isOutOfDay('committed'), false)
  assert.equal(isOutOfDay('completed'), false)
}

function testOnlyLiveTasksCanRest() {
  assert.deepEqual([...RESTABLE_STATUSES].sort(), ['committed', 'in_progress'])
}

function testNotesKeepThePath() {
  assert.equal(restNote('2026-10-16'), 'Set aside to the seed library on 2026-10-16.')
  assert.equal(drawNote('2026-10-20', '2026-10-16'), 'Drawn from the seed library on 2026-10-20; set aside from 2026-10-16.')
  assert.equal(drawNote('2026-10-16', '2026-10-16'), 'Drawn from the seed library on 2026-10-16.')
}

function testLibraryIsNewestFirst() {
  const row = (id: string, updated: string, day: string) => ({
    id, originalText: `task ${id}`, updatedAt: new Date(updated), lensGoalId: null, barId: null, questId: id === 'b' ? 'q1' : null,
    dailySession: { sessionDate: new Date(`${day}T00:00:00.000Z`) },
  })
  const lib = toSeedLibrary([row('a', '2026-10-10T09:00:00Z', '2026-10-10'), row('b', '2026-10-15T09:00:00Z', '2026-10-14')])
  assert.deepEqual(lib.map((e) => e.id), ['b', 'a'])
  assert.equal(lib[0].fromDay, '2026-10-14')
  assert.equal(lib[0].questId, 'q1')
  assert.equal(lib[1].text, 'task a')
}

function testLadderWidens() {
  // Set aside 10-16: back on 10-19 (3 days), open through 10-21.
  assert.deepEqual(resurfacing('2026-10-16', [], '2026-10-18'), { rung: 0, dueDay: '2026-10-19', due: false })
  assert.deepEqual(resurfacing('2026-10-16', [], '2026-10-19'), { rung: 0, dueDay: '2026-10-19', due: true })
  assert.deepEqual(resurfacing('2026-10-16', [], '2026-10-21'), { rung: 0, dueDay: '2026-10-19', due: true })
  // Passed by: climbs one rung from its due day, 7 more days.
  assert.deepEqual(resurfacing('2026-10-16', [], '2026-10-22'), { rung: 1, dueDay: '2026-10-26', due: false })
  // Kept resting on 10-20: climbs one rung from that day.
  assert.deepEqual(resurfacing('2026-10-16', ['2026-10-20'], '2026-10-20'), { rung: 1, dueDay: '2026-10-27', due: false })
  // Keeps before the last set-aside do not count.
  assert.deepEqual(resurfacing('2026-10-16', ['2026-10-01'], '2026-10-19').rung, 0)
}

function testLadderNeverStops() {
  // A year of silence: it keeps coming back, every 90 days at the top, and is never composted or drawn.
  const r = resurfacing('2026-01-01', [], '2027-01-01')
  assert.equal(r.rung >= 5, true)
  assert.equal(r.dueDay > '2027-01-01' || r.due, true)
  assert.equal(addDays('2026-12-30', 3), '2027-01-02')
}

function testNotesPlaceTheSeed() {
  const n = (body: string, at: string) => ({ body, createdAt: new Date(at) })
  const days = libraryDays(
    [
      n(restNote('2026-10-01'), '2026-10-01T08:00:00Z'),
      n('Drawn from the seed library on 2026-10-05.', '2026-10-05T08:00:00Z'),
      n(restNote('2026-10-16'), '2026-10-16T08:00:00Z'),
      n(keepNote('2026-10-20', '2026-10-27'), '2026-10-20T08:00:00Z'),
    ],
    new Date('2026-10-16T08:00:00Z'),
  )
  assert.deepEqual(days, { restDay: '2026-10-16', keepDays: ['2026-10-20'] })
  assert.equal(keepNote('2026-10-20', '2026-10-27'), 'Kept resting on 2026-10-20; it comes back on 2026-10-27.')
}

function testAtMostThreeComeBack() {
  const row = (id: string, rested: string) => ({
    id, originalText: `task ${id}`, updatedAt: new Date(`${rested}T09:00:00Z`), lensGoalId: null, barId: null, questId: null,
    dailySession: { sessionDate: new Date(`${rested}T00:00:00.000Z`) },
    notes: [{ body: restNote(rested), createdAt: new Date(`${rested}T09:00:00Z`) }],
  })
  const lib = toSeedLibrary(
    [row('a', '2026-10-16'), row('b', '2026-10-15'), row('c', '2026-10-15'), row('d', '2026-10-14'), row('e', '2026-10-17')],
    '2026-10-19',
  )
  assert.deepEqual(resurfacedToday(lib).map((e) => e.id), ['d', 'b', 'c'])
  assert.equal(lib.find((e) => e.id === 'e')?.resurfaced, false)
  assert.equal(lib.find((e) => e.id === 'e')?.dueDay, '2026-10-20')
}

testRestingIsOutOfTheDay(); testOnlyLiveTasksCanRest(); testNotesKeepThePath(); testLibraryIsNewestFirst()
testLadderWidens(); testLadderNeverStops(); testNotesPlaceTheSeed(); testAtMostThreeComeBack()
console.log('seed-library tests passed')
