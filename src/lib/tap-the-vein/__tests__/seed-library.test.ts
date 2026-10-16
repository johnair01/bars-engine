import assert from 'node:assert/strict'
import { drawNote, isOutOfDay, restNote, RESTABLE_STATUSES, toSeedLibrary } from '@/lib/tap-the-vein/seed-library'

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

testRestingIsOutOfTheDay(); testOnlyLiveTasksCanRest(); testNotesKeepThePath(); testLibraryIsNewestFirst()
console.log('seed-library tests passed')
