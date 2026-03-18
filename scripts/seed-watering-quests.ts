#!/usr/bin/env npx tsx
/**
 * Seed Campaign Watering Quests
 *
 * Creates 6 face-keyed watering quests and a "Water your campaign" thread.
 * Each quest advances campaign kernel watering progress when completed.
 *
 * Run: npx tsx scripts/seed-watering-quests.ts
 * Idempotent — safe to re-run.
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const WATERING_QUESTS: {
  id: string
  title: string
  description: string
  face: string
}[] = [
  {
    id: 'water-campaign-shaman',
    title: 'Name the threshold',
    description:
      '**Shaman**: What is the mythic entry point for this campaign? Why does it exist? What story are you crossing into?\n\nDescribe the threshold—the moment when someone steps from the ordinary world into this campaign.',
    face: 'shaman',
  },
  {
    id: 'water-campaign-regent',
    title: 'Set the structure',
    description:
      '**Regent**: What are the rules? What roles exist? What domain does this campaign operate in?\n\nDefine the structure—order, roles, and the allyship domain (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing).',
    face: 'regent',
  },
  {
    id: 'water-campaign-challenger',
    title: 'Define the first action',
    description:
      '**Challenger**: What is the proving ground? What is the first thing a player does?\n\nName the first action—the quest or step that proves commitment.',
    face: 'challenger',
  },
  {
    id: 'water-campaign-architect',
    title: 'Map the blueprint',
    description:
      '**Architect**: What is the strategy? What subcampaigns or adventures exist? What is the quest map?\n\nSketch the blueprint—how the campaign unfolds.',
    face: 'architect',
  },
  {
    id: 'water-campaign-diplomat',
    title: 'Invite the coalition',
    description:
      '**Diplomat**: Who is in? Who do you want to invite? What is the community scope?\n\nDefine the coalition—who belongs and how they are invited.',
    face: 'diplomat',
  },
  {
    id: 'water-campaign-sage',
    title: 'Integrate and launch',
    description:
      '**Sage**: What is the whole? How does it all fit together? Are you ready to launch?\n\nIntegrate—final coherence and launch readiness.',
    face: 'sage',
  },
]

async function main() {
  console.log('=== SEEDING CAMPAIGN WATERING QUESTS ===\n')

  const creator = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  }) || await db.player.findFirst()

  if (!creator) {
    console.error('❌ No players found. Create at least one player first.')
    process.exit(1)
  }

  console.log(`Using creator: ${creator.name}\n`)

  const questIds: string[] = []

  for (const q of WATERING_QUESTS) {
    const existing = await db.customBar.findUnique({ where: { id: q.id } })
    const data = {
      description: q.description,
      type: 'onboarding' as const,
      reward: 2,
      creatorId: creator.id,
      visibility: 'private' as const,
      isSystem: true,
      status: 'active' as const,
      inputs: JSON.stringify([
        { key: 'response', label: `Your ${q.face} response`, type: 'textarea', placeholder: 'Share your response...' },
      ]),
      completionEffects: JSON.stringify({
        effects: [{ type: 'advanceCampaignWatering' as const, face: q.face, fromInput: 'response' }],
      }),
    }

    if (existing) {
      await db.customBar.update({ where: { id: q.id }, data })
      console.log(`  ↻ Quest "${q.title}" updated`)
    } else {
      await db.customBar.create({
        data: { id: q.id, title: q.title, rootId: q.id, ...data },
      })
      await db.customBar.update({ where: { id: q.id }, data: { rootId: q.id } })
      console.log(`  ✦ Quest "${q.title}" created`)
    }
    questIds.push(q.id)
  }

  const threadId = 'water-campaign-thread'
  let thread = await db.questThread.findUnique({ where: { id: threadId } })

  const threadData = {
    title: 'Water your campaign',
    description:
      'Six steps to grow your campaign seed into a playable campaign. Each face adds structure and adoption.',
    threadType: 'standard' as const,
    creatorType: 'system' as const,
    creatorId: creator.id,
    completionReward: 5,
    status: 'active' as const,
  }

  if (thread) {
    thread = await db.questThread.update({ where: { id: threadId }, data: threadData })
    console.log(`\n  ↻ Thread "${thread.title}" updated`)
  } else {
    thread = await db.questThread.create({
      data: { id: threadId, ...threadData },
    })
    console.log(`\n  ✦ Thread "${thread.title}" created`)
  }

  await db.threadQuest.deleteMany({ where: { threadId } })
  await db.threadQuest.createMany({
    data: questIds.map((questId, i) => ({
      threadId,
      questId,
      position: i + 1,
    })),
  })
  console.log(`  Linked ${questIds.length} quests to thread`)

  console.log('\n✅ Campaign watering quests seeded.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
