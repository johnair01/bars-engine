#!/usr/bin/env npx tsx
/**
 * Seed Scene Atlas (creator-scene-grid): Instance + BarDeck + 52 BarDeckCards (4 suits × 13 ranks).
 *
 * Run:
 *   npx tsx scripts/seed-creator-scene-grid-deck.ts
 *   npm run seed:creator-scene-deck
 *
 * Optional: INSTANCE_SLUG=my-slug to override (default creator-scene-grid).
 *
 * @see .specify/specs/creator-scene-grid-deck/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import {
  SCENE_GRID_INSTANCE_SLUG,
  allSceneGridPrompts,
} from '../src/lib/creator-scene-grid-deck'

async function main() {
  const slug = process.env.INSTANCE_SLUG?.trim() || SCENE_GRID_INSTANCE_SLUG
  console.log(`Seeding Scene Atlas (instance slug: ${slug})\n`)

  const instance = await db.instance.upsert({
    where: { slug },
    update: {
      name: 'Creator scene grid (52-card BAR lab)',
      targetDescription:
        'Private-by-default grid deck: answer prompts with BARs to build a creative or production plan. Generic pedagogy — stack Charge → BAR → bind to card.',
    },
    create: {
      slug,
      name: 'Creator scene grid (52-card BAR lab)',
      domainType: 'creative',
      campaignRef: slug,
      targetDescription:
        'Private-by-default grid deck: answer prompts with BARs to build a creative or production plan. Generic pedagogy — stack Charge → BAR → bind to card.',
    },
  })
  console.log(`  Instance: ${instance.id} (${instance.slug})`)

  const deck = await db.barDeck.upsert({
    where: { instanceId: instance.id },
    update: {},
    create: { instanceId: instance.id },
  })
  console.log(`  BarDeck: ${deck.id}`)

  const prompts = allSceneGridPrompts()
  for (const row of prompts) {
    await db.barDeckCard.upsert({
      where: {
        deckId_suit_rank: {
          deckId: deck.id,
          suit: row.suit,
          rank: row.rank,
        },
      },
      update: {
        promptTitle: row.promptTitle,
        promptText: row.promptText,
        metadata: row.metadata,
      },
      create: {
        deckId: deck.id,
        suit: row.suit,
        rank: row.rank,
        promptTitle: row.promptTitle,
        promptText: row.promptText,
        metadata: row.metadata,
      },
    })
  }

  console.log(`  BarDeckCards upserted: ${prompts.length}`)
  console.log('\nDone. Open /creator-scene-deck in the app (logged in).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
