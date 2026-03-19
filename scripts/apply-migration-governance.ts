/**
 * Apply governance schema migration:
 * - Role: purpose, accountabilities, scope, npcFace, npcTier, prerequisites, orientationTemplateId
 * - PlayerRole: instanceId, nationId, focus, grantedByBarId, isFilledByNpc
 * - NpcProfile: new table linking Player ↔ NpcConstitution with operational budget fields
 *
 * All statements idempotent (IF NOT EXISTS / DO $$ … EXCEPTION duplicate_object).
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'

const STATEMENTS = [
  // Role: Holacracy + NPC governance fields
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "purpose" TEXT`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "accountabilities" TEXT`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'instance'`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "npcFace" TEXT`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "npcTier" INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT`,
  `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "orientationTemplateId" TEXT`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_orientationTemplateId_fkey') THEN
      ALTER TABLE "roles" ADD CONSTRAINT "roles_orientationTemplateId_fkey"
        FOREIGN KEY ("orientationTemplateId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,

  // PlayerRole: governance scope fields
  `ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "instanceId" TEXT`,
  `ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "nationId" TEXT`,
  `ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "focus" TEXT`,
  `ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "grantedByBarId" TEXT`,
  `ALTER TABLE "player_roles" ADD COLUMN IF NOT EXISTS "isFilledByNpc" BOOLEAN NOT NULL DEFAULT false`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_roles_grantedByBarId_fkey') THEN
      ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_grantedByBarId_fkey"
        FOREIGN KEY ("grantedByBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,

  // NpcProfile: new table linking Player actor ↔ NpcConstitution
  `CREATE TABLE IF NOT EXISTS "npc_profiles" (
    "id"               TEXT NOT NULL,
    "playerId"         TEXT NOT NULL,
    "constitutionId"   TEXT,
    "altitude"         TEXT NOT NULL,
    "tier"             INTEGER NOT NULL DEFAULT 1,
    "weeklyBudget"     INTEGER NOT NULL DEFAULT 10000,
    "tokensUsed"       INTEGER NOT NULL DEFAULT 0,
    "budgetResetAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dormantUntil"     TIMESTAMP(3),
    "sourceInstanceId" TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "npc_profiles_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "npc_profiles_playerId_key" ON "npc_profiles"("playerId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "npc_profiles_constitutionId_key" ON "npc_profiles"("constitutionId")`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'npc_profiles_playerId_fkey') THEN
      ALTER TABLE "npc_profiles" ADD CONSTRAINT "npc_profiles_playerId_fkey"
        FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'npc_profiles_constitutionId_fkey') THEN
      ALTER TABLE "npc_profiles" ADD CONSTRAINT "npc_profiles_constitutionId_fkey"
        FOREIGN KEY ("constitutionId") REFERENCES "npc_constitutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`,

  // Seed the 3 cultural substrate roles
  `INSERT INTO "roles" ("id", "key", "displayName", "description", "purpose", "accountabilities", "scope", "npcFace", "npcTier", "createdAt")
   VALUES
     (gen_random_uuid()::text, 'witness',  'Community Witness',       'Marks exemplary BARs for the cultural substrate pipeline',
      'Surface authentic community expression as card compression language',
      '["Review completed BARs for cultural substrate quality","Mark exemplary BARs that capture authentic player language","Bring language patterns to the Steward for distillation runs"]',
      'instance', 'shaman', 1, NOW()),
     (gen_random_uuid()::text, 'steward',  'Community Steward',       'Governs the cultural substrate distillation cadence',
      'Govern the rhythm at which community language is distilled into card vocabulary',
      '["Trigger distillation runs when corpus is ready","Monitor cluster size and quality signals","Coordinate with Curator on candidate review backlog"]',
      'instance', 'regent', 1, NOW()),
     (gen_random_uuid()::text, 'curator',  'Cultural Curator',        'Reviews distillation candidates and gates card language approval',
      'Hold editorial judgment over what AI-distilled language enters the card deck',
      '["Review pending distillation candidates weekly","Approve or reject AI-generated compression phrases","Edit approved names to align with community voice"]',
      'instance', 'sage', 2, NOW())
   ON CONFLICT ("key") DO NOTHING`,
]

async function main() {
  const directUrl = process.env.DATABASE_URL
  if (!directUrl) throw new Error('DATABASE_URL is required')

  const client = new PrismaClient({ datasources: { db: { url: directUrl } } })
  console.log(`[governance] Applying ${STATEMENTS.length} statements…`)

  for (const stmt of STATEMENTS) {
    try {
      await client.$executeRawUnsafe(stmt)
      const preview = stmt.trimStart().slice(0, 70).replace(/\s+/g, ' ')
      console.log(`  ✓ ${preview}…`)
    } catch (e: any) {
      const msg: string = e?.message ?? ''
      if (msg.includes('already exists') || msg.includes('duplicate column')) {
        console.log(`  ~ already exists: ${stmt.trimStart().slice(0, 50).replace(/\s+/g, ' ')}…`)
      } else {
        console.error(`\n  ✗ FAILED:\n${stmt}\n`)
        throw e
      }
    }
  }

  await client.$disconnect()
  console.log('[governance] Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
