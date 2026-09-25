import assert from 'node:assert/strict'
import { agreement, decisionTitle, earlierProposals, latestPerParticipant, proposerName, type SavedDecision } from './decision-ledger'

const make = (id: string, participantId: string, fundingOption: string, amountCents: number, createdAt: string, name: string | null = null): SavedDecision => ({
  id, participantId, fundingOption, amountCents, terms: null, status: 'proposed', createdAt, participant: { displayName: name },
})

const mom1 = make('a', 'mom', 'week', 50_000, '2026-09-24T18:00:00.000Z', 'Mom')
const mom2 = make('b', 'mom', 'month', 220_476, '2026-09-24T19:00:00.000Z', 'Mom')
const step = make('c', 'step', 'month', 220_476, '2026-09-24T18:30:00.000Z')

const all = [mom1, step, mom2] // deliberately not in date order

const latest = latestPerParticipant(all)
assert.deepEqual(latest.map((d) => d.id), ['b', 'c'], 'one per person, newest first, using their latest')
assert.deepEqual(earlierProposals(all, 'mom').map((d) => d.id), ['a'], 'earlier proposals exclude the latest')
assert.deepEqual(earlierProposals(all, 'step'), [], 'nothing earlier for a single proposal')

assert.equal(agreement([]), 'none')
assert.equal(agreement([mom2]), 'single')
assert.equal(agreement(latest), 'match', 'same option and amount')
assert.equal(agreement([mom1, step]), 'differ', 'different options')
assert.equal(agreement([make('x', 'p1', 'custom', 50_000, '2026-09-24T18:00:00.000Z'), make('y', 'p2', 'custom', 75_000, '2026-09-24T18:00:00.000Z')]), 'differ', 'same option, different custom amounts')

assert.equal(proposerName(mom2, 'mom'), 'You')
assert.equal(proposerName(mom2, 'someone-else'), 'Mom')
assert.equal(proposerName(step, 'mom'), 'Someone in the room', 'unnamed participants get a neutral label')

assert.equal(decisionTitle('ninety'), 'Fund 90 days')
assert.equal(decisionTitle('something-new'), 'something-new', 'unknown options pass through')

console.log('decision-ledger: ok')
