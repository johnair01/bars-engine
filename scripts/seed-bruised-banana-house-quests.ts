#!/usr/bin/env npx tsx
/**
 * Seed recurring **stub** quests for Bruised Banana House instance (Y Phase 2).
 * Quests use campaignRef bruised-banana-house + docQuestMetadata.houseRecurring.cadence.
 * No cron — operators use cadence as guidance; completion tracking can evolve later.
 *
 * Prereq: npm run seed:bb-house
 * Run: npm run seed:bb-house-quests
 *
 * @see .specify/specs/bruised-banana-house-instance/spec.md
 */

import './require-db-env'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { db } from '../src/lib/db'

const HOUSE_SLUG = 'bruised-banana-house'
const HOUSE_REF = 'bruised-banana-house'

type QuestRow = {
  id: string
  title: string
  description: string
  successCondition: string
  moveType: string
  allyshipDomain: string
  cadence: string
}

async function main() {
  console.log('🌱 Seeding Bruised Banana House recurring quest stubs...\n')

  const house = await db.instance.findUnique({ where: { slug: HOUSE_SLUG } })
  if (!house) {
    console.error(`❌ Instance not found: slug=${HOUSE_SLUG}. Run: npm run seed:bb-house`)
    process.exit(1)
  }

  const creator =
    (await db.player.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
    })) ?? (await db.player.findFirst())
  if (!creator) {
    console.error('❌ No players in DB. Create an admin or any player first.')
    process.exit(1)
  }

  const dataPath = path.join(process.cwd(), 'data', 'bruised_banana_house_recurring_quests.json')
  const file = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as { quests: QuestRow[] }
  const quests = file.quests

  for (const q of quests) {
    const docQuestMetadata = JSON.stringify({
      houseRecurring: {
        cadence: q.cadence,
        instanceSlug: HOUSE_SLUG,
        campaignRef: HOUSE_REF,
      },
    })

    await db.customBar.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        description: q.description,
        successCondition: q.successCondition,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain,
        campaignRef: HOUSE_REF,
        type: 'campaign',
        status: 'active',
        visibility: 'public',
        isSystem: true,
        docQuestMetadata,
        reward: 1,
      },
      create: {
        id: q.id,
        creatorId: creator.id,
        title: q.title,
        description: q.description,
        successCondition: q.successCondition,
        moveType: q.moveType,
        allyshipDomain: q.allyshipDomain,
        campaignRef: HOUSE_REF,
        type: 'campaign',
        status: 'active',
        visibility: 'public',
        isSystem: true,
        docQuestMetadata,
        reward: 1,
      },
    })
    console.log(`  ✓ [${q.cadence}] ${q.title} (${q.id})`)
  }

  console.log(`\n✅ ${quests.length} house quest(s) upserted for ${house.name} (${HOUSE_REF}).`)
  console.log('   Filter Market / boards by campaignRef bruised-banana-house when wiring UI.\n')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
