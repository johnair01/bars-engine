/*
  Warnings:

  - You are about to drop the column `returnText` on the `player_quests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[playerId,roleId]` on the table `player_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "nations" ADD COLUMN "cleanUp" TEXT;
ALTER TABLE "nations" ADD COLUMN "growUp" TEXT;
ALTER TABLE "nations" ADD COLUMN "showUp" TEXT;
ALTER TABLE "nations" ADD COLUMN "wakeUp" TEXT;

-- AlterTable
ALTER TABLE "playbooks" ADD COLUMN "cleanUp" TEXT;
ALTER TABLE "playbooks" ADD COLUMN "growUp" TEXT;
ALTER TABLE "playbooks" ADD COLUMN "showUp" TEXT;
ALTER TABLE "playbooks" ADD COLUMN "wakeUp" TEXT;

-- AlterTable
ALTER TABLE "vibulon_events" ADD COLUMN "archetypeMove" TEXT;
ALTER TABLE "vibulon_events" ADD COLUMN "questId" TEXT;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "quest_threads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "threadType" TEXT NOT NULL DEFAULT 'standard',
    "creatorType" TEXT NOT NULL DEFAULT 'system',
    "creatorId" TEXT,
    "creationCost" INTEGER NOT NULL DEFAULT 0,
    "completionReward" INTEGER NOT NULL DEFAULT 0,
    "allowedPlaybooks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "thread_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "thread_quests_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "quest_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "thread_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "thread_progress_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "quest_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quest_packs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creatorType" TEXT NOT NULL DEFAULT 'system',
    "creatorId" TEXT,
    "allowedPlaybooks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pack_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    CONSTRAINT "pack_quests_packId_fkey" FOREIGN KEY ("packId") REFERENCES "quest_packs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pack_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pack_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "completed" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "pack_progress_packId_fkey" FOREIGN KEY ("packId") REFERENCES "quest_packs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vibulons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "originSource" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "originTitle" TEXT NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "stakedOnBarId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vibulons_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "global_state" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyClock" INTEGER NOT NULL DEFAULT 0,
    "currentAct" INTEGER NOT NULL DEFAULT 1,
    "currentPeriod" INTEGER NOT NULL DEFAULT 1,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "unlockedTiers" TEXT NOT NULL DEFAULT '[]',
    "hexagramSequence" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "story_ticks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tickNumber" INTEGER NOT NULL,
    "actNumber" INTEGER NOT NULL,
    "trigger" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "features" TEXT NOT NULL DEFAULT '{}',
    "theme" TEXT NOT NULL DEFAULT '{}',
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_custom_bars" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    "rootId" TEXT,
    CONSTRAINT "custom_bars_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "custom_bars_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_bars_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "custom_bars" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_custom_bars" ("createdAt", "creatorId", "description", "id", "inputs", "reward", "status", "storyPath", "title", "type") SELECT "createdAt", "creatorId", "description", "id", "inputs", "reward", "status", "storyPath", "title", "type" FROM "custom_bars";
DROP TABLE "custom_bars";
ALTER TABLE "new_custom_bars" RENAME TO "custom_bars";
CREATE TABLE "new_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "preassignedRoleKey" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME
);
INSERT INTO "new_invites" ("createdAt", "id", "preassignedRoleKey", "status", "token", "usedAt") SELECT "createdAt", "id", "preassignedRoleKey", "status", "token", "usedAt" FROM "invites";
DROP TABLE "invites";
ALTER TABLE "new_invites" RENAME TO "invites";
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");
CREATE TABLE "new_player_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "inputs" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "player_quests_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "player_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_player_quests" ("assignedAt", "completedAt", "id", "playerId", "questId", "status") SELECT "assignedAt", "completedAt", "id", "playerId", "questId", "status" FROM "player_quests";
DROP TABLE "player_quests";
ALTER TABLE "new_player_quests" RENAME TO "player_quests";
CREATE UNIQUE INDEX "player_quests_playerId_questId_key" ON "player_quests"("playerId", "questId");
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "passwordHash" TEXT,
    "onboardingMode" TEXT DEFAULT 'expert',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "storyProgress" TEXT,
    "inviteId" TEXT NOT NULL,
    "nationId" TEXT,
    "playbookId" TEXT,
    "pronouns" TEXT,
    "attendance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "players_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "players_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("attendance", "contactType", "contactValue", "createdAt", "id", "inviteId", "name", "nationId", "playbookId", "pronouns") SELECT "attendance", "contactType", "contactValue", "createdAt", "id", "inviteId", "name", "nationId", "playbookId", "pronouns" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_contactType_contactValue_key" ON "players"("contactType", "contactValue");
CREATE TABLE "new_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "returnType" TEXT NOT NULL,
    "parentId" TEXT,
    "rootId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "quests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_quests" ("createdAt", "id", "prompt", "returnType", "title") SELECT "createdAt", "id", "prompt", "returnType", "title" FROM "quests";
DROP TABLE "quests";
ALTER TABLE "new_quests" RENAME TO "quests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

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
CREATE UNIQUE INDEX "player_roles_playerId_roleId_key" ON "player_roles"("playerId", "roleId");
