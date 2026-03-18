/**
 * Seed Golden Path Campaign
 *
 * Creates 5 starter quests with action + successCondition, links to orientation thread,
 * updates instance targetDescription. "Seed campaign in 30 min" flow.
 *
 * Run: npx tsx scripts/seed-golden-path-campaign.ts --instance=bruised-banana
 * Or:  npm run seed:golden-path
 *
 * Idempotent — safe to re-run. Upserts quests by id.
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const GOLDEN_PATH_STARTER_QUESTS = [
  {
    id: 'gp-starter-1',
    title: 'Name Your Intention',
    description: 'State one concrete intention for this campaign. What do you want to contribute or receive?',
    successCondition: 'Intention written and submitted.',
    moveType: 'wakeUp' as const,
    allyshipDomain: 'GATHERING_RESOURCES' as const,
  },
  {
    id: 'gp-starter-2',
    title: 'Reach Out to One Person',
    description: 'Contact one person who could support or benefit from your campaign work. Send a message, make a call, or schedule a conversation.',
    successCondition: 'One outreach completed.',
    moveType: 'showUp' as const,
    allyshipDomain: 'GATHERING_RESOURCES' as const,
  },
  {
    id: 'gp-starter-3',
    title: 'Share One Resource',
    description: 'Find and share one resource (link, doc, tool) that helps the campaign or a teammate.',
    successCondition: 'Resource shared with at least one person.',
    moveType: 'growUp' as const,
    allyshipDomain: 'GATHERING_RESOURCES' as const,
  },
  {
    id: 'gp-starter-4',
    title: 'Complete One Small Action',
    description: 'Do the next smallest honest action on your current quest. One email, one post, one decision.',
    successCondition: 'Action completed and recorded.',
    moveType: 'showUp' as const,
    allyshipDomain: 'DIRECT_ACTION' as const,
  },
  {
    id: 'gp-starter-5',
    title: 'Reflect and Report',
    description: 'Spend 2 minutes reflecting on what you did. Report one concrete outcome or learning.',
    successCondition: 'Reflection submitted.',
    moveType: 'cleanUp' as const,
    allyshipDomain: 'RAISE_AWARENESS' as const,
  },
]

const DEFAULT_TARGET_DESCRIPTION =
  'The Bruised Banana Residency supports artists and change-makers. Your quests contribute to the campaign—whether by gathering resources, raising awareness, or taking direct action.'

async function main() {
  const instanceSlug = process.argv.find((a) => a.startsWith('--instance='))?.split('=')[1] ?? 'bruised-banana'
  console.log(`=== SEEDING GOLDEN PATH CAMPAIGN (instance: ${instanceSlug}) ===\n`)

  // 1. Find creator
  const creator = await db.player.findFirst({
    where: { roles: { some: { role: { key: 'admin' } } } },
  }) ?? await db.player.findFirst()
  if (!creator) {
    console.error('❌ No players found. Create at least one player first.')
    process.exit(1)
  }
  console.log(`Using creator: ${creator.name} (${creator.id})\n`)

  // 2. Find or create Instance
  let instance = await db.instance.findUnique({ where: { slug: instanceSlug } })
  if (!instance) {
    instance = await db.instance.findFirst({
      where: { OR: [{ campaignRef: instanceSlug }, { slug: { contains: instanceSlug } }] },
    })
  }
  if (!instance) {
    console.error(`❌ Instance not found: ${instanceSlug}. Create the instance first (e.g. via seed-onboarding-thread or admin).`)
    process.exit(1)
  }
  console.log(`Instance: ${instance.name} (${instance.slug})\n`)

  // 3. Create/update 5 starter quests with successCondition
  console.log('Creating/updating 5 starter quests...')
  const questIds: string[] = []
  for (const q of GOLDEN_PATH_STARTER_QUESTS) {
    const quest = await db.customBar.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        description: q.description,
        successCondition: q.successCondition,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain,
        campaignRef: instance.campaignRef ?? instanceSlug,
        type: 'onboarding',
        reward: 1,
        status: 'active',
        visibility: 'public',
        isSystem: true,
      },
      create: {
        id: q.id,
        title: q.title,
        description: q.description,
        successCondition: q.successCondition,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain,
        campaignRef: instance.campaignRef ?? instanceSlug,
        type: 'onboarding',
        creatorId: creator.id,
        reward: 1,
        status: 'active',
        visibility: 'public',
        isSystem: true,
      },
    })
    questIds.push(quest.id)
    console.log(`  ✓ ${quest.title} (${quest.id})`)
  }

  // 4. Link to bruised-banana-orientation-thread (or create thread for instance)
  const threadId = 'bruised-banana-orientation-thread'
  let thread = await db.questThread.findUnique({ where: { id: threadId } })
  if (!thread) {
    thread = await db.questThread.create({
      data: {
        id: threadId,
        title: 'Help the Bruised Banana',
        description: 'Short wins after initiation. Golden path starter quests.',
        threadType: 'orientation',
        creatorType: 'system',
        creatorId: creator.id,
        completionReward: 2,
        status: 'active',
      },
    })
    console.log(`\nCreated thread: ${thread.title} (${thread.id})`)
  }

  // Replace thread quests with our 5 golden path starters (positions 1–5)
  await db.threadQuest.deleteMany({ where: { threadId } })
  await db.threadQuest.createMany({
    data: questIds.map((questId, i) => ({
      threadId,
      questId,
      position: i + 1,
    })),
  })
  console.log(`\nLinked ${questIds.length} quests to thread ${threadId}`)

  // 5. Update instance targetDescription if empty
  if (!instance.targetDescription?.trim()) {
    await db.instance.update({
      where: { id: instance.id },
      data: { targetDescription: DEFAULT_TARGET_DESCRIPTION },
    })
    console.log(`\nUpdated instance targetDescription`)
  } else {
    console.log(`\nInstance targetDescription already set (skipped)`)
  }

  console.log('\n=== GOLDEN PATH CAMPAIGN SEEDED ===')
  console.log(`Instance: ${instance.name}`)
  console.log(`Thread: ${thread.title}`)
  console.log(`Quests: ${questIds.join(', ')}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
