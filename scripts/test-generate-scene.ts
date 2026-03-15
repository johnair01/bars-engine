#!/usr/bin/env tsx
/**
 * Quick smoke test for generateScene.
 * Usage: npx tsx scripts/test-generate-scene.ts
 */
import './require-db-env'
import { generateScene } from '../src/lib/growth-scene/generator'
import { db } from '../src/lib/db'

async function main() {
  const state = await db.alchemyPlayerState.findFirst()
  if (!state) { console.log('No alchemy state found'); process.exit(1) }
  console.log('Player:', state.playerId, 'State:', state.channel, state.altitude)

  const result = await generateScene(state.playerId)
  if ('error' in result) {
    console.error('Error:', result.error)
    process.exit(1)
  }
  console.log('Scene ID:', result.scene.id)
  console.log('Vector:', result.dsl.vector)
  console.log('Cards:', result.dsl.cards.length)
  console.log('Choices:', result.dsl.choices.map(c => c.key).join(', '))
  await db.$disconnect()
}

main().catch((err) => { console.error('Threw:', err); process.exit(1) })
