/**
 * Assemble the Allyship Deck → public/allyship-deck/allyship-deck.json (ADK Phase 1).
 * Deterministic; no AI, no DB. Run: npm run deck:assemble
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { assembleDeck } from '../src/lib/allyship-deck/assemble'

const OUT = join(process.cwd(), 'public', 'allyship-deck', 'allyship-deck.json')

function main() {
  // Stable generatedAt so re-runs don't churn the committed file unless content changes.
  const deck = assembleDeck('2026-06-15T00:00:00.000Z')
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(deck, null, 2) + '\n', 'utf8')
  const { move, instruction, authored, total } = deck.counts
  console.log(`✅ Allyship Deck assembled → ${OUT}`)
  console.log(`   move cards: ${move} (authored: ${authored}, generated: ${move - authored})`)
  console.log(`   instruction cards: ${instruction}`)
  console.log(`   problems: ${deck.problems.length}`)
  console.log(`   total cards: ${total}`)
}

main()
