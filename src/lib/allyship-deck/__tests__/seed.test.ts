import assert from 'node:assert'
import { assembleDeck } from '../assemble'
import { buildDeckSeed } from '../seed'
import type { MoveCard } from '../types'

const deck = assembleDeck()
const card = deck.cards.find((c): c is MoveCard => c.kind === 'move' && c.id === 'OPEN-GR-SHAMAN')
assert.ok(card, 'fixture card OPEN-GR-SHAMAN exists')

// self reading uses the introspective question; description leads with "Your move".
const self = buildDeckSeed(card, 'self')
assert.strictEqual(self.title, card.title)
assert.ok(self.description.startsWith('Your move:'), 'description leads with the concrete move')
assert.ok(card.action && self.description.includes(card.action), 'includes the action')
assert.ok(self.description.includes('The practice:'), 'still carries the practice')
assert.ok(self.description.includes(card.remediation), 'includes remediation')
assert.ok(self.description.includes(card.primaryQuestion), 'self → primaryQuestion')
assert.strictEqual(self.rootId, 'deck_OPEN-GR-SHAMAN')
assert.strictEqual(self.provenance.sourceType, 'deck_card')
assert.strictEqual(self.provenance.deckCardId, 'OPEN-GR-SHAMAN')
assert.strictEqual(self.provenance.move, card.move)
assert.strictEqual(self.provenance.operation, card.operation)
assert.strictEqual(self.provenance.subject, 'self')

// campaign reading swaps to the for-others question.
const others = buildDeckSeed(card, 'campaign')
assert.ok(others.description.includes(card.campaignQuestion), 'campaign → campaignQuestion')
assert.strictEqual(others.provenance.subject, 'campaign')

console.log('✓ allyship-deck buildDeckSeed tests passed')
