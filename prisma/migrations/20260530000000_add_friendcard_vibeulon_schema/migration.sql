-- Reconcile migration for the Vibeulon Ledger / Instance Participation schema
-- (models added to prisma/schema.prisma in a8270e0 without a migration).
--
-- The original migration ran directly against production on 2026-06-09, created
-- "vibeulon_ledger", then failed partway — leaving a P3009 failed-migration marker
-- that blocks every subsequent deploy. The file itself was never committed.
--
-- This reconstruction is deliberately IDEMPOTENT (IF NOT EXISTS / duplicate-safe
-- FK guards) so it can be safely re-applied over the partially-migrated production
-- database after the failed marker is cleared with:
--   npx prisma migrate resolve --rolled-back 20260530000000_add_friendcard_vibeulon_schema
-- It only creates objects that are missing and never drops or rewrites existing data.

-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "maxAssignments" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "vibeulon_ledger" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sourceInstanceId" TEXT,
    "targetInstanceId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibeulon_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "instance_participation" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "localBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "instance_participation_playerId_instanceId_key" ON "instance_participation"("playerId", "instanceId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "vibeulon_ledger" ADD CONSTRAINT "vibeulon_ledger_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "instance_participation" ADD CONSTRAINT "instance_participation_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "instance_participation" ADD CONSTRAINT "instance_participation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
