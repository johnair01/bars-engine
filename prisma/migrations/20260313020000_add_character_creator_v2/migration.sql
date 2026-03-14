-- Add CHARACTER_CREATOR support to adventures table
ALTER TABLE "adventures" ADD COLUMN IF NOT EXISTS "adventureType" TEXT;
ALTER TABLE "adventures" ADD COLUMN IF NOT EXISTS "playbookTemplate" TEXT;

-- Create player_playbooks table for character creator results
CREATE TABLE IF NOT EXISTS "player_playbooks" (
  "id"            TEXT NOT NULL,
  "playerId"      TEXT NOT NULL,
  "adventureId"   TEXT NOT NULL,
  "playbookName"  TEXT NOT NULL,
  "playerAnswers" TEXT,
  "playbookMoves" TEXT,
  "playbookBonds" TEXT,
  "shareToken"    TEXT NOT NULL,
  "completedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "player_playbooks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "player_playbooks_shareToken_key" UNIQUE ("shareToken"),
  CONSTRAINT "player_playbooks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "player_playbooks_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "player_playbooks_playerId_idx" ON "player_playbooks"("playerId");
CREATE INDEX IF NOT EXISTS "player_playbooks_adventureId_idx" ON "player_playbooks"("adventureId");
