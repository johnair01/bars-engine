#!/usr/bin/env npx tsx
/**
 * Seed canonical 52-card BAR deck for instances.
 * 4 suits (domains) × 13 ranks.
 * Spec: BAR System v1
 */
import './require-db-env'
import { db } from '../src/lib/db'
import { getCanonicalPrompts } from '../src/lib/bar-deck/prompts'

async function main() {
  console.log('--- Seeding BAR Deck (52 cards) ---')

  const instances = await db.instance.findMany({
    select: { id: true, name: true, slug: true },
  })

  if (instances.length === 0) {
    console.log('No instances found. Create an instance first.')
    process.exit(0)
  }

  const prompts = getCanonicalPrompts()
  console.log(`Canonical prompts: ${prompts.length} cards (4 suits × 13 ranks)`)

  for (const instance of instances) {
    const deck = await db.barDeck.upsert({
      where: { instanceId: instance.id },
      create: { instanceId: instance.id },
      update: {},
    })

    const existing = await db.barDeckCard.count({ where: { deckId: deck.id } })
    if (existing >= 52) {
      console.log(`  ${instance.name} (${instance.slug}): deck already has 52 cards`)
      continue
    }

    await db.barDeckCard.createMany({
      data: prompts.map((p) => ({
        deckId: deck.id,
        suit: p.suit,
        rank: p.rank,
        promptTitle: p.promptTitle,
        promptText: p.promptText,
        shufflePower: p.shufflePower,
      })),
      skipDuplicates: true,
    })

    const count = await db.barDeckCard.count({ where: { deckId: deck.id } })
    console.log(`  ${instance.name} (${instance.slug}): ${count} cards`)
  }

  console.log('--- Done ---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
