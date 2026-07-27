/**
 * Export the Allyship Deck with practice overlays baked in →
 * public/allyship-deck/allyship-deck-with-practices.json
 *
 * The base deck (`npm run deck:assemble`) carries move data only; practice
 * overlays are normally built at runtime. This export attaches a `practice`
 * object to every move card so the JSON is self-contained for consumers that
 * cannot run the TypeScript build.
 *
 * Deterministic; no AI, no DB. Run: npm run deck:export-practices
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { assembleDeck } from '../src/lib/allyship-deck/assemble'
import { buildCardPracticeOverlay, PILOT_CARD_PRACTICE_OVERLAY_IDS } from '../src/lib/allyship-deck/practice-overlays'
import type { AllyshipCard, MoveCard } from '../src/lib/allyship-deck/types'

const OUT = join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck-with-practices.json')

function isMoveCard(card: AllyshipCard): card is MoveCard {
  return card.kind === 'move'
}

function main() {
  const deck = assembleDeck('2026-06-15T00:00:00.000Z')
  const pilotIds = new Set<string>(PILOT_CARD_PRACTICE_OVERLAY_IDS)

  let withPractice = 0
  const failures: { cardId: string; error: string }[] = []

  const cards = deck.cards.map((card) => {
    if (!isMoveCard(card)) return card
    try {
      const practice = buildCardPracticeOverlay(card.id)
      withPractice++
      return { ...card, practiceTier: pilotIds.has(card.id) ? 'pilot' : 'derived', practice }
    } catch (error) {
      failures.push({ cardId: card.id, error: (error as Error).message })
      return { ...card, practiceTier: 'unavailable', practice: null }
    }
  })

  const output = {
    ...deck,
    deck_slug: 'allyship-deck-with-practices',
    export: {
      kind: 'deck-with-practices',
      practiceOverlayVersion: 'card-practice-overlay-v0',
      cardsWithPractice: withPractice,
      pilotReviewedCardIds: [...PILOT_CARD_PRACTICE_OVERLAY_IDS],
      failures,
    },
    cards,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n', 'utf8')

  console.log(`✅ Allyship Deck (with practices) exported → ${OUT}`)
  console.log(`   move cards: ${deck.counts.move} (practice attached: ${withPractice})`)
  console.log(`   instruction cards: ${deck.counts.instruction}`)
  if (failures.length) console.log(`   ⚠️  practice build failures: ${failures.length}`)
}

main()
