-- CreateTable: shadow_321_sessions
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "shadow_321_sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase3Snapshot" TEXT NOT NULL,
    "phase2Snapshot" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "linkedBarId" TEXT,
    "linkedQuestId" TEXT,
    "questCompletedAt" TIMESTAMP(3),

    CONSTRAINT "shadow_321_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shadow_321_sessions_playerId_idx" ON "shadow_321_sessions"("playerId");

CREATE INDEX IF NOT EXISTS "shadow_321_sessions_outcome_idx" ON "shadow_321_sessions"("outcome");
