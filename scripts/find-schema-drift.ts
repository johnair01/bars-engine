import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function main() {
  // Get all columns currently in DB
  const dbCols = await db.$queryRaw<any[]>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name
  `
  const dbSet = new Set(dbCols.map((r:any) => `${r.table_name}.${r.column_name}`))

  // Try to detect missing columns by running a simple select on each table
  // that the schema.prisma declares. Use $queryRaw to probe key models.
  const probes: [string, string][] = [
    ['SELECT "inviteId" FROM custom_bars LIMIT 0', 'custom_bars.inviteId'],
    ['SELECT "campaignRef" FROM custom_bars LIMIT 0', 'custom_bars.campaignRef'],
    ['SELECT "lockType" FROM custom_bars LIMIT 0', 'custom_bars.lockType'],
    ['SELECT "allyshipDomain" FROM custom_bars LIMIT 0', 'custom_bars.allyshipDomain'],
    ['SELECT "nation" FROM custom_bars LIMIT 0', 'custom_bars.nation'],
    ['SELECT "archetype" FROM custom_bars LIMIT 0', 'custom_bars.archetype'],
    ['SELECT "sceneType" FROM alchemy_scene_templates LIMIT 0', 'alchemy_scene_templates.sceneType'],
    ['SELECT "targetChannel" FROM alchemy_scene_templates LIMIT 0', 'alchemy_scene_templates.targetChannel'],
    ['SELECT "status" FROM alchemy_scene_templates LIMIT 0', 'alchemy_scene_templates.status'],
    ['SELECT "slug" FROM instances LIMIT 0', 'instances.slug'],
    ['SELECT "shareToken" FROM player_playbooks LIMIT 0', 'player_playbooks.shareToken'],
    ['SELECT "playerAnswers" FROM player_playbooks LIMIT 0', 'player_playbooks.playerAnswers'],
    ['SELECT "playbookName" FROM player_playbooks LIMIT 0', 'player_playbooks.playbookName'],
    ['SELECT "adventureType" FROM adventures LIMIT 0', 'adventures.adventureType'],
    ['SELECT "playbookTemplate" FROM adventures LIMIT 0', 'adventures.playbookTemplate'],
  ]

  const missing: string[] = []
  for (const [sql, label] of probes) {
    try {
      await db.$queryRawUnsafe(sql)
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        missing.push(label)
        console.log(`  MISSING: ${label}`)
      }
    }
  }
  if (missing.length === 0) {
    console.log('  All probed columns present ✅')
  } else {
    console.error('\n  Fix: Add missing columns to a migration file, then run prisma migrate deploy.')
    console.error('  Never use db push on shared/production databases.')
    process.exit(1)
  }
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => db.$disconnect())
