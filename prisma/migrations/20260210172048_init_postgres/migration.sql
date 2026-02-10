-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "preassignedRoleKey" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "passwordHash" TEXT,
    "onboardingMode" TEXT DEFAULT 'expert',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "storyProgress" TEXT,
    "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false,
    "hasCompletedFirstQuest" BOOLEAN NOT NULL DEFAULT false,
    "hasCreatedFirstQuest" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" TIMESTAMP(3),
    "inviteId" TEXT NOT NULL,
    "nationId" TEXT,
    "playbookId" TEXT,
    "pronouns" TEXT,
    "attendance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isForecasted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_roles" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedByAdminId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "player_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bars" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_bars" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'vibe',
    "reward" INTEGER NOT NULL DEFAULT 1,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "claimedById" TEXT,
    "storyPath" TEXT,
    "allowedTrigrams" TEXT,
    "inputs" TEXT NOT NULL DEFAULT '[]',
    "moveType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "kotterStage" INTEGER NOT NULL DEFAULT 1,
    "storyContent" TEXT,
    "storyMood" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "hexagramId" INTEGER,
    "periodGenerated" INTEGER,
    "firstCompleterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    "twineLogic" TEXT,
    "completionEffects" TEXT,
    "rootId" TEXT,

    CONSTRAINT "custom_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_bars" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "barId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "parentId" TEXT,
    "rootId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_quests" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "inputs" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "player_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_threads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "threadType" TEXT NOT NULL DEFAULT 'standard',
    "creatorType" TEXT NOT NULL DEFAULT 'system',
    "creatorId" TEXT,
    "creationCost" INTEGER NOT NULL DEFAULT 0,
    "completionReward" INTEGER NOT NULL DEFAULT 0,
    "allowedPlaybooks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_quests" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "thread_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_progress" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "thread_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_packs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creatorType" TEXT NOT NULL DEFAULT 'system',
    "creatorId" TEXT,
    "allowedPlaybooks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_quests" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,

    CONSTRAINT "pack_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_progress" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "completed" TEXT NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pack_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibulon_events" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "archetypeMove" TEXT,
    "questId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibulon_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibulons" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "originSource" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "originTitle" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "stakedOnBarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibulons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imgUrl" TEXT,
    "wakeUp" TEXT,
    "cleanUp" TEXT,
    "growUp" TEXT,
    "showUp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "content" TEXT,
    "centralConflict" TEXT,
    "primaryQuestion" TEXT,
    "vibe" TEXT,
    "energy" TEXT,
    "shadowSignposts" TEXT,
    "lightSignposts" TEXT,
    "examples" TEXT,
    "wakeUp" TEXT,
    "cleanUp" TEXT,
    "growUp" TEXT,
    "showUp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starter_packs" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "initialVibeulons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "starter_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorAdminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "payloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_state" (
    "id" TEXT NOT NULL,
    "storyClock" INTEGER NOT NULL DEFAULT 0,
    "currentAct" INTEGER NOT NULL DEFAULT 1,
    "currentPeriod" INTEGER NOT NULL DEFAULT 1,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "unlockedTiers" TEXT NOT NULL DEFAULT '[]',
    "hexagramSequence" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_ticks" (
    "id" TEXT NOT NULL,
    "tickNumber" INTEGER NOT NULL,
    "actNumber" INTEGER NOT NULL,
    "trigger" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_ticks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "features" TEXT NOT NULL DEFAULT '{}',
    "theme" TEXT NOT NULL DEFAULT '{}',
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "players_contactType_contactValue_key" ON "players"("contactType", "contactValue");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "player_roles_playerId_roleId_key" ON "player_roles"("playerId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "player_quests_playerId_questId_key" ON "player_quests"("playerId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "thread_quests_threadId_position_key" ON "thread_quests"("threadId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "thread_quests_threadId_questId_key" ON "thread_quests"("threadId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "thread_progress_threadId_playerId_key" ON "thread_progress"("threadId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "pack_quests_packId_questId_key" ON "pack_quests"("packId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "pack_progress_packId_playerId_key" ON "pack_progress"("packId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "nations_name_key" ON "nations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "playbooks_name_key" ON "playbooks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "starter_packs_playerId_key" ON "starter_packs"("playerId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_bars" ADD CONSTRAINT "player_bars_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_bars" ADD CONSTRAINT "player_bars_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "quests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_quests" ADD CONSTRAINT "player_quests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_quests" ADD CONSTRAINT "player_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_quests" ADD CONSTRAINT "thread_quests_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "quest_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_quests" ADD CONSTRAINT "thread_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_progress" ADD CONSTRAINT "thread_progress_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "quest_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_quests" ADD CONSTRAINT "pack_quests_packId_fkey" FOREIGN KEY ("packId") REFERENCES "quest_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_quests" ADD CONSTRAINT "pack_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_progress" ADD CONSTRAINT "pack_progress_packId_fkey" FOREIGN KEY ("packId") REFERENCES "quest_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibulon_events" ADD CONSTRAINT "vibulon_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibulons" ADD CONSTRAINT "vibulons_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starter_packs" ADD CONSTRAINT "starter_packs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
