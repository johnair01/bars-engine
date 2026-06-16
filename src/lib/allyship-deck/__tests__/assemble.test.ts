/**
 * Allyship Deck assembler — unit tests.
 * Run: npx tsx src/lib/allyship-deck/__tests__/assemble.test.ts
 */
import assert from 'node:assert/strict'
import { assembleDeck } from '../assemble'
import { AUTHORED, DOMAINS, MOVES, OPERATIONS, SUBMOVES } from '../move-library'
import type { MoveCard } from '../types'

function testGrammarCounts() {
  assert.equal(MOVES.length, 5, '5 Basic Moves')
  assert.equal(OPERATIONS.length, 6, '6 Operations')
  assert.equal(DOMAINS.length, 4, '4 Domains')
  // 30 submoves fully populated
  for (const m of MOVES) {
    for (const op of OPERATIONS) {
      const sub = SUBMOVES[m.key][op.key]
      assert.ok(sub && sub.action && sub.question, `submove exists for ${m.key}/${op.key}`)
    }
  }
}

function testDeckShape() {
  const deck = assembleDeck('2026-06-15T00:00:00.000Z')
  const moveCards = deck.cards.filter((c): c is MoveCard => c.kind === 'move')

  assert.equal(moveCards.length, 120, '5 × 6 × 4 = 120 move cards')
  assert.equal(deck.counts.move, 120)

  // every (move × op × domain) cell present, ids unique
  const ids = new Set(moveCards.map((c) => c.id))
  assert.equal(ids.size, 120, 'unique ids')

  // both question registers populated on every card
  for (const c of moveCards) {
    assert.ok(c.primaryQuestion.length > 0, `primaryQuestion on ${c.id}`)
    assert.ok(c.campaignQuestion.length > 0, `campaignQuestion on ${c.id}`)
    assert.ok(c.submovePrompt.length > 0, `submovePrompt on ${c.id}`)
  }

  // authored overrides merged
  const authoredIds = Object.keys(AUTHORED)
  assert.equal(deck.counts.authored, authoredIds.length, 'authored count matches overrides')
  for (const id of authoredIds) {
    const card = moveCards.find((c) => c.id === id)
    assert.ok(card && card.status === 'authored', `${id} is authored`)
    assert.ok(card!.title !== `${card!.operation} · ${card!.move}`, `${id} has authored title`)
  }

  // outputBar fixed by move (open_up → experience)
  const open = moveCards.find((c) => c.id === 'OPEN-GR-SHAMAN')!
  assert.equal(open.outputBar, 'experience', 'Open Up → Experience BAR')

  // instruction set + problems present
  assert.ok(deck.counts.instruction >= 20, 'instruction card set present')
  assert.ok(deck.problems.length >= 5, 'consult problems seeded')
  for (const p of deck.problems) assert.ok(p.cardIds.length > 0, `problem ${p.id} maps to cards`)
}

function testDeterministic() {
  const a = assembleDeck('2026-06-15T00:00:00.000Z')
  const b = assembleDeck('2026-06-15T00:00:00.000Z')
  assert.equal(JSON.stringify(a), JSON.stringify(b), 'assembly is deterministic')
}

testGrammarCounts()
testDeckShape()
testDeterministic()
console.log('✓ allyship-deck assembler tests OK')
