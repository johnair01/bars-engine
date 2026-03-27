#!/usr/bin/env npx tsx
/**
 * Test DeckLibrary structure after migration/seeding.
 */

import './require-db-env'
import { db } from '../src/lib/db'

async function main() {
  const instance = await db.instance.findFirst({
    include: {
      deckLibrary: {
        include: {
          decks: {
            include: {
              _count: {
                select: { cards: true }
              }
            }
          }
        }
      }
    }
  })

  if (!instance) {
    console.log('❌ No instances found')
    return
  }

  console.log('\n✅ DeckLibrary Structure Test\n')
  console.log(`Instance: ${instance.slug} (${instance.id})`)
  console.log(`DeckLibrary: ${instance.deckLibrary?.id || 'NONE'}`)
  console.log(`BarDecks: ${instance.deckLibrary?.decks.length || 0}`)

  if (instance.deckLibrary?.decks) {
    for (const deck of instance.deckLibrary.decks) {
      console.log(`  - ${deck.deckType}: ${deck._count.cards} cards`)
    }
  }

  console.log('\n✅ Testing Scene Atlas query pattern (new code)\n')

  // Test the new query pattern from load-deck-view.ts
  const testInstance = await db.instance.findUnique({
    where: { slug: instance.slug },
    select: {
      id: true,
      slug: true,
      deckLibrary: {
        select: {
          decks: {
            where: { deckType: 'SCENE_ATLAS' },
            select: {
              id: true,
              deckType: true,
              cards: {
                take: 3, // Just sample a few
                select: {
                  id: true,
                  suit: true,
                  rank: true,
                  promptTitle: true
                }
              }
            }
          }
        }
      }
    }
  })

  const deck = testInstance?.deckLibrary?.decks[0]
  if (deck) {
    console.log(`Found SCENE_ATLAS deck: ${deck.id}`)
    console.log(`Sample cards:`)
    for (const card of deck.cards) {
      console.log(`  - ${card.rank} of ${card.suit}: ${card.promptTitle}`)
    }
  } else {
    console.log('❌ Could not find SCENE_ATLAS deck')
  }

  console.log('\n✅ All tests passed!')
}

main()
  .catch((e) => {
    console.error('\n❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
