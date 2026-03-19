/**
 * Apply Phase 3 schema migration (cultural substrate pipeline) directly.
 *
 * Uses direct DATABASE_URL (not Prisma Accelerate) so DDL is allowed.
 * Safe to run multiple times — all statements are idempotent (IF NOT EXISTS).
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const STATEMENTS = [
  // CustomBar: exemplar flag
  `ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "isExemplar" BOOLEAN NOT NULL DEFAULT false`,

  // PlayerAlignment table
  `CREATE TABLE IF NOT EXISTS "player_alignments" (
    "id"        TEXT NOT NULL,
    "playerId"  TEXT NOT NULL,
    "counts"    TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "player_alignments_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "player_alignments_playerId_key" ON "player_alignments"("playerId")`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'player_alignments_playerId_fkey'
    ) THEN
      ALTER TABLE "player_alignments" ADD CONSTRAINT "player_alignments_playerId_fkey"
        FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,

  // CarriedWeight table
  `CREATE TABLE IF NOT EXISTS "carried_weights" (
    "id"               TEXT NOT NULL,
    "playerId"         TEXT NOT NULL,
    "beliefText"       TEXT NOT NULL,
    "shadowName"       TEXT,
    "source"           TEXT NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'held',
    "loadLevel"        INTEGER NOT NULL DEFAULT 1,
    "heldSince"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metabolizedAt"    TIMESTAMP(3),
    "metabolizedBarId" TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "carried_weights_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE INDEX IF NOT EXISTS "carried_weights_playerId_status_idx" ON "carried_weights"("playerId", "status")`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'carried_weights_playerId_fkey'
    ) THEN
      ALTER TABLE "carried_weights" ADD CONSTRAINT "carried_weights_playerId_fkey"
        FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'carried_weights_metabolizedBarId_fkey'
    ) THEN
      ALTER TABLE "carried_weights" ADD CONSTRAINT "carried_weights_metabolizedBarId_fkey"
        FOREIGN KEY ("metabolizedBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,

  // DistillationCandidate table
  `CREATE TABLE IF NOT EXISTS "distillation_candidates" (
    "id"                    TEXT NOT NULL,
    "moveType"              TEXT,
    "archetype"             TEXT,
    "allyshipDomain"        TEXT,
    "nationKey"             TEXT,
    "sourceBarIds"          TEXT NOT NULL,
    "clusterSize"           INTEGER NOT NULL,
    "secondRegisterName"    TEXT NOT NULL,
    "internalExpr"          TEXT NOT NULL,
    "interpersonalExpr"     TEXT NOT NULL,
    "systemicExpr"          TEXT NOT NULL,
    "episodeTitleCandidate" TEXT,
    "aiReasoning"           TEXT,
    "status"                TEXT NOT NULL DEFAULT 'pending',
    "approvedName"          TEXT,
    "reviewedAt"            TIMESTAMP(3),
    "reviewedById"          TEXT,
    "runId"                 TEXT NOT NULL,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "distillation_candidates_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE INDEX IF NOT EXISTS "distillation_candidates_status_createdAt_idx"
    ON "distillation_candidates"("status", "createdAt")`,
]

async function main() {
  const directUrl = process.env.DATABASE_URL
  if (!directUrl) throw new Error('DATABASE_URL is required')

  const client = new PrismaClient({ datasources: { db: { url: directUrl } } })

  console.log(`[phase3] Applying ${STATEMENTS.length} statements…`)

  for (const stmt of STATEMENTS) {
    try {
      await client.$executeRawUnsafe(stmt)
      const preview = stmt.trimStart().slice(0, 70).replace(/\s+/g, ' ')
      console.log(`  ✓ ${preview}…`)
    } catch (e: any) {
      const msg: string = e?.message ?? ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate column') ||
        msg.includes('DuplicateColumn')
      ) {
        const preview = stmt.trimStart().slice(0, 60).replace(/\s+/g, ' ')
        console.log(`  ~ already exists, skipping: ${preview}…`)
      } else {
        console.error(`\n  ✗ FAILED:\n${stmt}\n`)
        throw e
      }
    }
  }

  await client.$disconnect()
  console.log('[phase3] Migration complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
