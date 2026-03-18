-- Add creatorType to players (human | agent for NPC/simulated player content ecology)
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "creatorType" TEXT NOT NULL DEFAULT 'human';

-- Add moveIds to instances (JSON array of NationMove ids — campaign move pool)
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "moveIds" TEXT NOT NULL DEFAULT '[]';
