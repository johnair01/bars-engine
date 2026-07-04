import assert from 'node:assert/strict'
import {
  MYTH_READ_ITEMS,
  buildMythReadPersistencePayload,
  scoreMyths,
  type MythReadAnswerValue,
  type MythReadItem,
} from '../myths-read'

type AnswerMap = Partial<Record<MythReadItem['id'], MythReadAnswerValue>>

function run(name: string, fn: () => void) {
  fn()
  console.log(`✓ ${name}`)
}

run('q10 cross-loads M9 fully and M1 half', () => {
  const outcome = scoreMyths({ q10: 4 })

  assert.equal(outcome.scores.M9.raw, 4)
  assert.equal(outcome.scores.M9.max, 4)
  assert.equal(outcome.scores.M9.pct, 1)

  assert.equal(outcome.scores.M1.raw, 2)
  assert.equal(outcome.scores.M1.max, 6)
  assert.equal(outcome.scores.M1.pct, 1 / 3)
})

run('floor rule keeps rank one and filters weak rank two/three', () => {
  const outcome = scoreMyths({ q1: 4, q2: 1, q3: 1 })

  assert.deepEqual(
    outcome.surfaced.map((entry) => entry.myth.id),
    ['M1'],
  )
})

run('canonical order breaks ties after pct and peak', () => {
  const answers = Object.fromEntries(
    MYTH_READ_ITEMS.map((item) => [item.id, 0]),
  ) as AnswerMap
  const outcome = scoreMyths(answers)

  assert.deepEqual(
    outcome.ranked.slice(0, 4).map((entry) => entry.myth.id),
    ['M8', 'M7', 'M1', 'M5'],
  )
})

run('double-loaded myths compare by normalized pct', () => {
  const outcome = scoreMyths({ q7: 4, q12: 4, q8: 2, q9: 2 })

  assert.equal(outcome.ranked[0].myth.id, 'M7')
  assert.equal(outcome.scores.M7.pct, 1)
  assert.equal(outcome.scores.M8.pct, 0.5)
})

run('campaign seed stores the chosen game as vector, not emotion route', () => {
  const payload = buildMythReadPersistencePayload(
    { q8: 4, q9: 4, q7: 2, q12: 2 },
    { mythId: 'M8', flavor: 'anger', intensity: 8, gameFace: 'challenger' },
  )

  assert.deepEqual(payload.capturedCharge, {
    mythId: 'M8',
    flavor: 'anger',
    intensity: 8,
    gameFace: 'challenger',
  })
  assert.equal(payload.seedBarDrafts[0].gameName, 'MythBusting')
  assert.equal(payload.seedBarDrafts[0].gameFace, 'challenger')
})
