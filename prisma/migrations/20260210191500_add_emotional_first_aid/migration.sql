-- Add archetype-specific first aid flavor
ALTER TABLE "playbooks"
ADD COLUMN "emotionalFirstAid" TEXT;

-- First aid tool catalog (admin-managed)
CREATE TABLE "emotional_first_aid_tools" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "moveType" TEXT NOT NULL DEFAULT 'cleanUp',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "twineLogic" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_first_aid_tools_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "emotional_first_aid_tools_key_key" ON "emotional_first_aid_tools"("key");

-- Player first aid sessions
CREATE TABLE "emotional_first_aid_sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "toolId" TEXT,
    "contextQuestId" TEXT,
    "issueTag" TEXT,
    "issueText" TEXT,
    "stuckBefore" INTEGER NOT NULL,
    "stuckAfter" INTEGER,
    "delta" INTEGER,
    "recommendedToolKey" TEXT,
    "mintedAmount" INTEGER NOT NULL DEFAULT 0,
    "applyToQuesting" BOOLEAN NOT NULL DEFAULT false,
    "twineSnapshot" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "emotional_first_aid_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "emotional_first_aid_sessions_playerId_createdAt_idx"
    ON "emotional_first_aid_sessions"("playerId", "createdAt");

ALTER TABLE "emotional_first_aid_sessions"
ADD CONSTRAINT "emotional_first_aid_sessions_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "emotional_first_aid_sessions"
ADD CONSTRAINT "emotional_first_aid_sessions_toolId_fkey"
FOREIGN KEY ("toolId") REFERENCES "emotional_first_aid_tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
