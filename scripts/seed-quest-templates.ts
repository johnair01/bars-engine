/**
 * Seed Quest Templates — Campaign Self-Serve L1
 *
 * Populates the quest_templates table with canonical template blueprints.
 * Idempotent — upserts by unique key. Safe to re-run.
 *
 * Run: npx tsx scripts/seed-quest-templates.ts
 * Or:  npm run seed:quest-templates
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { ALL_QUEST_TEMPLATE_SEEDS } from '../src/lib/quest-template-seeds'

const db = new PrismaClient()

async function main() {
  console.log('=== SEEDING QUEST TEMPLATES ===\n')
  console.log(`Templates to seed: ${ALL_QUEST_TEMPLATE_SEEDS.length}\n`)

  let created = 0
  let updated = 0

  for (const seed of ALL_QUEST_TEMPLATE_SEEDS) {
    const result = await db.questTemplate.upsert({
      where: { key: seed.key },
      update: {
        name: seed.name,
        description: seed.description,
        category: seed.category,
        defaultSettings: seed.defaultSettings,
        copyTemplate: seed.copyTemplate,
        narrativeHooks: seed.narrativeHooks ?? undefined,
        sortOrder: seed.sortOrder,
        status: 'active',
      },
      create: {
        key: seed.key,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        defaultSettings: seed.defaultSettings,
        copyTemplate: seed.copyTemplate,
        narrativeHooks: seed.narrativeHooks ?? undefined,
        sortOrder: seed.sortOrder,
        status: 'active',
      },
    })

    const existed = result.createdAt < result.updatedAt
    if (existed) {
      updated++
      console.log(`  ↻ ${seed.category}/${seed.key} (updated)`)
    } else {
      created++
      console.log(`  ✓ ${seed.category}/${seed.key} (created)`)
    }
  }

  console.log(`\n=== QUEST TEMPLATES SEEDED ===`)
  console.log(`Created: ${created}, Updated: ${updated}, Total: ${ALL_QUEST_TEMPLATE_SEEDS.length}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
