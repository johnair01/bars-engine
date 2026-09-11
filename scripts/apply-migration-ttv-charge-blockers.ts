/**
 * Apply the Tap the Vein charge/blocker migration.
 *
 * Canonical record: prisma/migrations/20260813120000_add_ttv_charge_and_blockers/migration.sql
 * This runner exists because the legacy migration chain is divergent — `migrate
 * deploy` would also apply unrelated pending migrations. Same pattern and reason
 * as scripts/apply-migration-governance.ts. See docs/PRISMA_MIGRATE_STRATEGY.md.
 *
 * Every statement is additive and idempotent: no drops, no column rewrites, no
 * backfill. Safe to re-run.
 *
 * Run:  npx tsx scripts/apply-migration-ttv-charge-blockers.ts
 * Then: npx prisma migrate resolve --applied 20260813120000_add_ttv_charge_and_blockers
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const STATEMENTS = [
  // 1. Persisted brainstorm candidates
  `ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN IF NOT EXISTS "brainstorm_candidates" JSONB`,

  // 2. Per-task charge + blocker state
  `ALTER TABLE "tap_the_vein_tasks" ADD COLUMN IF NOT EXISTS "charge_level" TEXT`,
  `ALTER TABLE "tap_the_vein_tasks" ADD COLUMN IF NOT EXISTS "charge_note" TEXT`,
  `ALTER TABLE "tap_the_vein_tasks" ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP(3)`,
  `CREATE INDEX IF NOT EXISTS "tap_the_vein_tasks_playerId_blocked_at_idx" ON "tap_the_vein_tasks" ("playerId", "blocked_at")`,

  // 3. The context/blocker log
  `CREATE TABLE IF NOT EXISTS "tap_the_vein_task_notes" (
    "id"           TEXT         NOT NULL,
    "task_id"      TEXT         NOT NULL,
    "player_id"    TEXT         NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind"         TEXT         NOT NULL DEFAULT 'context',
    "body"         TEXT         NOT NULL,
    "charge_level" TEXT,
    CONSTRAINT "tap_the_vein_task_notes_pkey" PRIMARY KEY ("id")
  )`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tap_the_vein_task_notes_task_id_fkey') THEN
      ALTER TABLE "tap_the_vein_task_notes" ADD CONSTRAINT "tap_the_vein_task_notes_task_id_fkey"
        FOREIGN KEY ("task_id") REFERENCES "tap_the_vein_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,

  // 4. Indexes
  `CREATE INDEX IF NOT EXISTS "tap_the_vein_task_notes_task_id_created_at_idx" ON "tap_the_vein_task_notes" ("task_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "tap_the_vein_task_notes_player_id_kind_idx" ON "tap_the_vein_task_notes" ("player_id", "kind")`,
]

async function main() {
  const directUrl = process.env.DATABASE_URL
  if (!directUrl) throw new Error('DATABASE_URL is required')

  const client = new PrismaClient({ datasources: { db: { url: directUrl } } })
  console.log(`[ttv-charge] Applying ${STATEMENTS.length} additive statements…`)

  for (const stmt of STATEMENTS) {
    try {
      await client.$executeRawUnsafe(stmt)
      console.log(`  ✓ ${stmt.trimStart().slice(0, 72).replace(/\s+/g, ' ')}…`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('already exists') || msg.includes('duplicate column')) {
        console.log(`  ~ already exists: ${stmt.trimStart().slice(0, 52).replace(/\s+/g, ' ')}…`)
      } else {
        console.error(`\n  ✗ FAILED:\n${stmt}\n`)
        throw e
      }
    }
  }

  await client.$disconnect()
  console.log('[ttv-charge] Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
