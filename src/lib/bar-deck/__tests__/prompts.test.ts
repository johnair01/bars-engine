/**
 * BAR Deck Prompts — Tests
 * Run with: npx tsx src/lib/bar-deck/__tests__/prompts.test.ts
 *
 * Spec: BAR System v1 — canonical deck has 52 cards, 4 suits only
 */

import { getCanonicalPrompts } from '../prompts'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testCanonicalDeck52Cards() {
  const prompts = getCanonicalPrompts()
  assert(prompts.length === 52, `Deck should have 52 cards, got ${prompts.length}`)
}

function testFourSuitsOnly() {
  const prompts = getCanonicalPrompts()
  const suits = new Set(prompts.map((p) => p.suit))
  const expectedSuits = new Set(ALLYSHIP_DOMAINS.map((d) => d.key))
  assert(suits.size === 4, `Should have 4 suits, got ${suits.size}`)
  for (const s of suits) {
    assert(expectedSuits.has(s), `Suit ${s} should be a valid domain`)
  }
}

function test13RanksPerSuit() {
  const prompts = getCanonicalPrompts()
  const bySuit = new Map<string, number[]>()
  for (const p of prompts) {
    const ranks = bySuit.get(p.suit) ?? []
    ranks.push(p.rank)
    bySuit.set(p.suit, ranks)
  }
  for (const [suit, ranks] of bySuit) {
    assert(ranks.length === 13, `Suit ${suit} should have 13 ranks, got ${ranks.length}`)
    const unique = new Set(ranks)
    assert(unique.size === 13, `Suit ${suit} should have ranks 1–13, got duplicates`)
    for (let r = 1; r <= 13; r++) {
      assert(ranks.includes(r), `Suit ${suit} missing rank ${r}`)
    }
  }
}

function testOneShuffleCardPerSuit() {
  const prompts = getCanonicalPrompts()
  const shuffleCards = prompts.filter((p) => p.shufflePower)
  assert(shuffleCards.length === 4, `Should have 4 shuffle cards (1 per suit), got ${shuffleCards.length}`)
  const suitsWithShuffle = new Set(shuffleCards.map((p) => p.suit))
  assert(suitsWithShuffle.size === 4, 'Each suit should have exactly one shuffle card')
}

function testPromptStructure() {
  const prompts = getCanonicalPrompts()
  for (const p of prompts) {
    assert(typeof p.promptTitle === 'string' && p.promptTitle.length > 0, 'Each card needs promptTitle')
    assert(typeof p.promptText === 'string' && p.promptText.length > 0, 'Each card needs promptText')
    assert(Number.isInteger(p.rank) && p.rank >= 1 && p.rank <= 13, `Invalid rank ${p.rank}`)
  }
}

async function run() {
  testCanonicalDeck52Cards()
  testFourSuitsOnly()
  test13RanksPerSuit()
  testOneShuffleCardPerSuit()
  testPromptStructure()
  console.log('✓ All BAR deck prompt tests passed')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
