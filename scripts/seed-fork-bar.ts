#!/usr/bin/env tsx
/**
 * Seed the "Fork This Game" BAR into the quest library.
 *
 * Run:
 *   npx tsx scripts/seed-fork-bar.ts
 *
 * Idempotent — upsert by title. Safe to re-run.
 */

import './require-db-env'
import { db } from '../src/lib/db'

const FORK_BAR_TITLE = 'Fork This Game'

async function main() {
  // Find any admin player to use as creator
  const creator = await db.player.findFirst({
    where: { role: 'admin' },
    select: { id: true, name: true },
  })

  if (!creator) {
    console.error('No admin player found. Create an admin player first.')
    process.exit(1)
  }

  console.log(`Using creator: ${creator.name} (${creator.id})`)

  const existing = await db.customBar.findFirst({
    where: { title: FORK_BAR_TITLE, isSystem: true },
    select: { id: true },
  })

  if (existing) {
    await db.customBar.update({
      where: { id: existing.id },
      data: {
        description: [
          'A Brave Act of Resistance: deploy your own copy of the BARs Engine.',
          '',
          'When you complete this BAR, you\'ll have your own game running on your own server.',
          'Claim this quest to start the process. Your host will receive a request to export',
          'a config bundle for you, then follow the Fork Wizard to deploy your instance.',
        ].join('\n'),
        visibility: 'public',
        status: 'active',
        storyContent: 'fork_game',
      },
    })
    console.log(`Updated existing "Fork This Game" BAR: ${existing.id}`)
    return
  }

  const bar = await db.customBar.create({
    data: {
      creatorId: creator.id,
      title: FORK_BAR_TITLE,
      description: [
        'A Brave Act of Resistance: deploy your own copy of the BARs Engine.',
        '',
        'When you complete this BAR, you\'ll have your own game running on your own server.',
        'Claim this quest to start the process. Your host will receive a request to export',
        'a config bundle for you, then follow the Fork Wizard to deploy your instance.',
      ].join('\n'),
      type: 'quest',
      reward: 0,
      visibility: 'public',
      status: 'active',
      isSystem: true,
      storyContent: 'fork_game',
      inputs: '[]',
      rootId: 'temp',
    },
  })

  await db.customBar.update({
    where: { id: bar.id },
    data: { rootId: bar.id },
  })

  console.log(`Created "Fork This Game" BAR: ${bar.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
