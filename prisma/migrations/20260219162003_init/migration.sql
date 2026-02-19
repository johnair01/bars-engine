-- AlterTable
ALTER TABLE "app_config" ADD COLUMN     "activeInstanceId" TEXT,
ADD COLUMN     "orientationQuestId" TEXT;

-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN     "allowedNations" TEXT,
ADD COLUMN     "twineStoryId" TEXT;

-- CreateTable
CREATE TABLE "bar_shares" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polarities" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nation_moves" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "polarityId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isStartingUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "appliesToStatus" TEXT NOT NULL DEFAULT '[]',
    "requirementsSchema" TEXT NOT NULL DEFAULT '{}',
    "effectsSchema" TEXT NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nation_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_nation_move_unlocks" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_nation_move_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_move_logs" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "moveId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdBarId" TEXT,
    "inputsJson" TEXT,
    "effectsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_move_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twine_stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'twine_html',
    "sourceText" TEXT NOT NULL,
    "parsedJson" TEXT NOT NULL DEFAULT '{}',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twine_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twine_runs" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT,
    "currentPassageId" TEXT NOT NULL,
    "visited" TEXT NOT NULL DEFAULT '[]',
    "firedBindings" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "twine_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twine_bindings" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twine_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instances" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domainType" TEXT NOT NULL,
    "theme" TEXT,
    "targetDescription" TEXT,
    "goalAmountCents" INTEGER,
    "currentAmountCents" INTEGER NOT NULL DEFAULT 0,
    "isEventMode" BOOLEAN NOT NULL DEFAULT false,
    "stripeOneTimeUrl" TEXT,
    "patreonUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "playerId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_memberships" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "roleKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_shares_fromUserId_createdAt_idx" ON "bar_shares"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "bar_shares_toUserId_createdAt_idx" ON "bar_shares"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "bar_shares_barId_createdAt_idx" ON "bar_shares"("barId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "polarities_key_key" ON "polarities"("key");

-- CreateIndex
CREATE UNIQUE INDEX "nation_moves_key_key" ON "nation_moves"("key");

-- CreateIndex
CREATE INDEX "nation_moves_nationId_sortOrder_idx" ON "nation_moves"("nationId", "sortOrder");

-- CreateIndex
CREATE INDEX "player_nation_move_unlocks_moveId_unlockedAt_idx" ON "player_nation_move_unlocks"("moveId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "player_nation_move_unlocks_playerId_moveId_key" ON "player_nation_move_unlocks"("playerId", "moveId");

-- CreateIndex
CREATE INDEX "quest_move_logs_questId_createdAt_idx" ON "quest_move_logs"("questId", "createdAt");

-- CreateIndex
CREATE INDEX "quest_move_logs_playerId_createdAt_idx" ON "quest_move_logs"("playerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "twine_stories_slug_key" ON "twine_stories"("slug");

-- CreateIndex
CREATE INDEX "twine_stories_createdById_createdAt_idx" ON "twine_stories"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "twine_runs_playerId_updatedAt_idx" ON "twine_runs"("playerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "twine_runs_storyId_playerId_questId_key" ON "twine_runs"("storyId", "playerId", "questId");

-- CreateIndex
CREATE INDEX "twine_bindings_storyId_scopeType_scopeId_idx" ON "twine_bindings"("storyId", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "instances_slug_key" ON "instances"("slug");

-- CreateIndex
CREATE INDEX "donations_instanceId_createdAt_idx" ON "donations"("instanceId", "createdAt");

-- CreateIndex
CREATE INDEX "donations_playerId_createdAt_idx" ON "donations"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "instance_memberships_instanceId_createdAt_idx" ON "instance_memberships"("instanceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "instance_memberships_instanceId_playerId_key" ON "instance_memberships"("instanceId", "playerId");

-- AddForeignKey
ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_twineStoryId_fkey" FOREIGN KEY ("twineStoryId") REFERENCES "twine_stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_shares" ADD CONSTRAINT "bar_shares_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_shares" ADD CONSTRAINT "bar_shares_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_shares" ADD CONSTRAINT "bar_shares_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nation_moves" ADD CONSTRAINT "nation_moves_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nation_moves" ADD CONSTRAINT "nation_moves_polarityId_fkey" FOREIGN KEY ("polarityId") REFERENCES "polarities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_nation_move_unlocks" ADD CONSTRAINT "player_nation_move_unlocks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_nation_move_unlocks" ADD CONSTRAINT "player_nation_move_unlocks_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "nation_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_move_logs" ADD CONSTRAINT "quest_move_logs_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_move_logs" ADD CONSTRAINT "quest_move_logs_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "nation_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_move_logs" ADD CONSTRAINT "quest_move_logs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_move_logs" ADD CONSTRAINT "quest_move_logs_createdBarId_fkey" FOREIGN KEY ("createdBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twine_stories" ADD CONSTRAINT "twine_stories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twine_runs" ADD CONSTRAINT "twine_runs_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "twine_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twine_runs" ADD CONSTRAINT "twine_runs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twine_bindings" ADD CONSTRAINT "twine_bindings_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "twine_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twine_bindings" ADD CONSTRAINT "twine_bindings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_memberships" ADD CONSTRAINT "instance_memberships_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_memberships" ADD CONSTRAINT "instance_memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_activeInstanceId_fkey" FOREIGN KEY ("activeInstanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
