import * as assert from 'node:assert'
import { assembleDeck } from '../assemble'
import { DOMAINS, MOVES, OPERATIONS } from '../move-library'
import { getDeckCardToolAffinities, validateDeckCardToolAffinities } from '../tool-affinities'
import type { MoveCard } from '../types'

const deck = assembleDeck('2026-07-05T00:00:00.000Z')
const moveCards = deck.cards.filter((card): card is MoveCard => card.kind === 'move')

assert.strictEqual(moveCards.length, 120)
assert.deepStrictEqual(validateDeckCardToolAffinities(moveCards), [])

for (const card of moveCards) {
  const affinities = getDeckCardToolAffinities(card)
  assert.ok(affinities.length >= 2, `${card.id} returns at least two viable tool affinities`)
  assert.ok(affinities.every((affinity) => affinity.reasons.length > 0), `${card.id} affinities include reasons`)
  assert.ok(affinities.every((affinity) => affinity.source.move === card.move), `${card.id} preserves card move source`)
  assert.ok(affinities.every((affinity) => affinity.source.operation === card.operation), `${card.id} preserves operation source`)
  assert.ok(affinities.every((affinity) => affinity.source.domain === card.domain), `${card.id} preserves domain source`)
  assert.ok(affinities.every((affinity) => affinity.source.outputBar === card.outputBar), `${card.id} preserves output BAR source`)
}

for (const move of MOVES) {
  const card = moveCards.find((candidate) => candidate.move === move.key)
  assert.ok(card, `${move.key} sample exists`)
  const affinities = getDeckCardToolAffinities(card!)
  assert.ok(
    affinities.some((affinity) => affinity.reasons.some((reason) => reason.includes(`${move.key} move`))),
    `${move.key} influences affinity reasons`,
  )
}

for (const operation of OPERATIONS) {
  const card = moveCards.find((candidate) => candidate.operation === operation.key)
  assert.ok(card, `${operation.key} sample exists`)
  const affinities = getDeckCardToolAffinities(card!)
  assert.ok(
    affinities.some((affinity) => affinity.reasons.some((reason) => reason.includes(`${operation.key} operation`))),
    `${operation.key} influences affinity reasons`,
  )
}

for (const domain of DOMAINS) {
  const card = moveCards.find((candidate) => candidate.domain === domain.key)
  assert.ok(card, `${domain.key} sample exists`)
  const affinities = getDeckCardToolAffinities(card!)
  assert.ok(
    affinities.some((affinity) => affinity.reasons.some((reason) => reason.includes(`${domain.key} domain`))),
    `${domain.key} influences affinity reasons`,
  )
}

const openGatherChallenger = moveCards.find((card) => card.id === 'OPEN-GR-CHALLENGER')!
const openGatherShaman = moveCards.find((card) => card.id === 'OPEN-GR-SHAMAN')!
assert.ok(getDeckCardToolAffinities(openGatherChallenger)[0].score > 0)
assert.notStrictEqual(
  getDeckCardToolAffinities(openGatherChallenger)[0].reasons.join('|'),
  getDeckCardToolAffinities(openGatherShaman)[0].reasons.join('|'),
  'operation changes the top card-only affinity reasoning on Open/Gather Resources',
)

console.log('✓ allyship-deck tool affinity tests OK')
