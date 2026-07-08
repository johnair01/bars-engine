-- Lenses goal-setting onboarding: temporal containers, authored goals, and workshop drafts.

CREATE TABLE "lenses" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "parentLensId" TEXT,
  "periodKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lenses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lenses_playerId_type_periodKey_key" ON "lenses"("playerId", "type", "periodKey");
CREATE INDEX "lenses_playerId_type_idx" ON "lenses"("playerId", "type");

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

ALTER TABLE "custom_bars" ADD COLUMN "lensId" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "lensGoalId" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "plantSnapshot" JSONB;
ALTER TABLE "custom_bars" ADD COLUMN "gardenId" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "experienceIntent" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "dissatisfaction" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "satisfaction" TEXT;

CREATE TABLE "tap_the_vein_daily_sessions" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sessionDate" DATE NOT NULL,
  "lensLevel" TEXT,
  "lensCategory" TEXT,
  "lensGoalId" TEXT,
  "lensIntentionTextSnapshot" TEXT,
  "rawEntry" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL,
  "brainstormCandidateCount" INTEGER NOT NULL DEFAULT 0,
  "committedTaskCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'open',
  "sealedAt" TIMESTAMP(3),
  CONSTRAINT "tap_the_vein_daily_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tap_the_vein_daily_sessions_playerId_sessionDate_key" ON "tap_the_vein_daily_sessions"("playerId", "sessionDate");
CREATE INDEX "tap_the_vein_daily_sessions_playerId_status_idx" ON "tap_the_vein_daily_sessions"("playerId", "status");

CREATE TABLE "tap_the_vein_tasks" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "dailySessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'brainstorm',
  "originalText" TEXT NOT NULL,
  "lensLevel" TEXT,
  "lensCategory" TEXT,
  "lensGoalId" TEXT,
  "attachSnapshot" JSONB,
  "priorityRank" INTEGER,
  "lifeLensDomain" TEXT,
  "status" TEXT NOT NULL DEFAULT 'committed',
  "carriedFromDailySessionId" TEXT,
  "carryCount" INTEGER NOT NULL DEFAULT 0,
  "compostReason" TEXT,
  "compostedAt" TIMESTAMP(3),
  "campaignId" TEXT,
  "visibility" TEXT,
  "questId" TEXT,
  "barId" TEXT,
  CONSTRAINT "tap_the_vein_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tap_the_vein_tasks_playerId_status_idx" ON "tap_the_vein_tasks"("playerId", "status");
CREATE INDEX "tap_the_vein_tasks_playerId_carryCount_idx" ON "tap_the_vein_tasks"("playerId", "carryCount");
CREATE INDEX "tap_the_vein_tasks_campaignId_visibility_idx" ON "tap_the_vein_tasks"("campaignId", "visibility");
CREATE INDEX "tap_the_vein_tasks_lensGoalId_idx" ON "tap_the_vein_tasks"("lensGoalId");
CREATE UNIQUE INDEX "tap_the_vein_tasks_dailySessionId_priorityRank_key" ON "tap_the_vein_tasks"("dailySessionId", "priorityRank");
ALTER TABLE "tap_the_vein_tasks" ADD CONSTRAINT "tap_the_vein_tasks_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "tap_the_vein_daily_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
