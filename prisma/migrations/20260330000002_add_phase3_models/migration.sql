-- Phase 3: Cultural Substrate Pipeline
-- Safe to apply idempotently via apply-migration-direct pattern.
-- isExemplar uses NOT NULL DEFAULT false — PostgreSQL backfills existing rows with false.
-- No existing data is touched by the new tables.

-- CustomBar: exemplar flag for distillation pipeline
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "isExemplar" BOOLEAN NOT NULL DEFAULT false;

-- PlayerAlignment: silent accumulator (one row per player, JSON counts)
CREATE TABLE IF NOT EXISTS "player_alignments" (
    "id"        TEXT NOT NULL,
    "playerId"  TEXT NOT NULL,
    "counts"    TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "player_alignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "player_alignments_playerId_key" ON "player_alignments"("playerId");
-- PG <15 has no ADD CONSTRAINT IF NOT EXISTS; use duplicate_object for idempotency
DO $$ BEGIN
  ALTER TABLE "player_alignments" ADD CONSTRAINT "player_alignments_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CarriedWeight: shadow belief as holdable card object
CREATE TABLE IF NOT EXISTS "carried_weights" (
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
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "carried_weights_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "carried_weights_playerId_status_idx" ON "carried_weights"("playerId", "status");
DO $$ BEGIN
  ALTER TABLE "carried_weights" ADD CONSTRAINT "carried_weights_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "carried_weights" ADD CONSTRAINT "carried_weights_metabolizedBarId_fkey"
    FOREIGN KEY ("metabolizedBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- DistillationCandidate: AI-generated card language candidates for human review
CREATE TABLE IF NOT EXISTS "distillation_candidates" (
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
);
CREATE INDEX IF NOT EXISTS "distillation_candidates_status_createdAt_idx" ON "distillation_candidates"("status", "createdAt");
