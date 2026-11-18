-- Lenses goal lineage bridge: stable authored goals, draft material, and TTV/BAR lineage snapshots.

ALTER TABLE "custom_bars" ADD COLUMN "lensGoalId" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "plantSnapshot" JSONB;

CREATE TABLE "lens_goals" (
  "id" TEXT NOT NULL,
  "stableKey" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "lensId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'year',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "satisfactionPayoff" TEXT,
  "metric" TEXT,
  "parentGoalId" TEXT,
  "superpowerSource" TEXT,
  "alignmentType" TEXT NOT NULL DEFAULT 'progress',
  "status" TEXT NOT NULL DEFAULT 'active',
  "keepOrder" INTEGER NOT NULL DEFAULT 0,
  "supersededById" TEXT,
  "archivedAt" TIMESTAMP(3),
  "lineageSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lens_goals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lens_goals_stableKey_key" ON "lens_goals"("stableKey");
CREATE INDEX "lens_goals_playerId_lensId_idx" ON "lens_goals"("playerId", "lensId");
CREATE INDEX "lens_goals_playerId_domain_idx" ON "lens_goals"("playerId", "domain");
CREATE INDEX "lens_goals_parentGoalId_idx" ON "lens_goals"("parentGoalId");
CREATE INDEX "lens_goals_supersededById_idx" ON "lens_goals"("supersededById");
CREATE INDEX "lens_goals_archivedAt_idx" ON "lens_goals"("archivedAt");

CREATE TABLE "lens_workshop_drafts" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "lensId" TEXT NOT NULL,
  "domain" TEXT,
  "cadence" TEXT NOT NULL,
  "parentGoalId" TEXT,
  "freewrite" TEXT,
  "options" JSONB NOT NULL,
  "keptOrder" JSONB NOT NULL,
  "feelings" JSONB,
  "vagueMovement" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lens_workshop_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lens_workshop_drafts_playerId_lensId_idx" ON "lens_workshop_drafts"("playerId", "lensId");
CREATE INDEX "lens_workshop_drafts_parentGoalId_idx" ON "lens_workshop_drafts"("parentGoalId");

ALTER TABLE "tap_the_vein_tasks" ADD COLUMN "lensGoalId" TEXT;
ALTER TABLE "tap_the_vein_tasks" ADD COLUMN "attachSnapshot" JSONB;
ALTER TABLE "tap_the_vein_tasks" ADD COLUMN "priorityRank" INTEGER;
CREATE INDEX "tap_the_vein_tasks_lensGoalId_idx" ON "tap_the_vein_tasks"("lensGoalId");
CREATE UNIQUE INDEX "tap_the_vein_tasks_dailySessionId_priorityRank_key" ON "tap_the_vein_tasks"("dailySessionId", "priorityRank");
