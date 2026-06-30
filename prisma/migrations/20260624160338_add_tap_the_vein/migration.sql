-- CreateTable: TapTheVeinDailySession
-- Captures the lenses state at session-start (face, level, category, intention text snapshot)
-- so we can replay what seeded this day even if lenses state changes later.
CREATE TABLE "tap_the_vein_daily_sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionDate" DATE NOT NULL,
    "lensLevel" TEXT,
    "lensCategory" TEXT,
    "lensFaceKey" TEXT,
    "lensIntentionTextSnapshot" TEXT,
    "rawEntry" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "eaChannel" TEXT,
    "chargeStrength" TEXT,
    "brainstormCandidateCount" INTEGER NOT NULL DEFAULT 0,
    "committedTaskCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sealedAt" TIMESTAMP(3),

    CONSTRAINT "tap_the_vein_daily_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TapTheVeinTask
-- Lifecycle: committed → in_progress → (completed | carried_over | composted | assigned_to_campaign | upgraded_to_quest).
-- Player is the authority on completion — no auto-transitions.
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
    "lensFaceKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'committed',
    "carriedFromDailySessionId" TEXT,
    "carryCount" INTEGER NOT NULL DEFAULT 0,
    "compostReason" TEXT,
    "compostedAt" TIMESTAMP(3),
    "campaignId" TEXT,
    "visibility" TEXT,
    "questId" TEXT,

    CONSTRAINT "tap_the_vein_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tap_the_vein_daily_sessions_playerId_sessionDate_key" ON "tap_the_vein_daily_sessions"("playerId", "sessionDate");

-- CreateIndex
CREATE INDEX "tap_the_vein_daily_sessions_playerId_status_idx" ON "tap_the_vein_daily_sessions"("playerId", "status");

-- CreateIndex
CREATE INDEX "tap_the_vein_tasks_playerId_status_idx" ON "tap_the_vein_tasks"("playerId", "status");

-- CreateIndex
CREATE INDEX "tap_the_vein_tasks_playerId_carryCount_idx" ON "tap_the_vein_tasks"("playerId", "carryCount");

-- CreateIndex
CREATE INDEX "tap_the_vein_tasks_campaignId_visibility_idx" ON "tap_the_vein_tasks"("campaignId", "visibility");

-- AddForeignKey
ALTER TABLE "tap_the_vein_daily_sessions" ADD CONSTRAINT "tap_the_vein_daily_sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tap_the_vein_tasks" ADD CONSTRAINT "tap_the_vein_tasks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tap_the_vein_tasks" ADD CONSTRAINT "tap_the_vein_tasks_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "tap_the_vein_daily_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;