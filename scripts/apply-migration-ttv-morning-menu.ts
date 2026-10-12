/**
 * Apply the Tap the Vein morning-menu migration.
 *
 * Canonical record: prisma/migrations/20261009120000_add_ttv_morning_menu/migration.sql
 * Same reason as scripts/apply-migration-ttv-charge-blockers.ts: the legacy chain
 * is divergent, so `migrate deploy` would also apply unrelated pending migrations.
 * See docs/PRISMA_MIGRATE_STRATEGY.md.
 *
 * One additive, idempotent statement. Safe to re-run.
 *
 * Run:  npx tsx scripts/apply-migration-ttv-morning-menu.ts
 * Then: npx prisma migrate resolve --applied 20261009120000_add_ttv_morning_menu
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const STATEMENTS = [
  `ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN IF NOT EXISTS "morning_menu" JSONB`,
]

async function main() {
  const directUrl = process.env.DATABASE_URL
  if (!directUrl) throw new Error('DATABASE_URL is required')

  const client = new PrismaClient({ datasources: { db: { url: directUrl } } })
  console.log(`[ttv-menu] Applying ${STATEMENTS.length} additive statement…`)
  for (const stmt of STATEMENTS) {
    await client.$executeRawUnsafe(stmt)
    console.log(`  ✓ ${stmt}`)
  }
  await client.$disconnect()
  console.log('[ttv-menu] Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
