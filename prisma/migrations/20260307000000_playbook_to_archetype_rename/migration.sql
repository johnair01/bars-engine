-- Playbook → Archetype terminology rename (BA)
-- Idempotent: safe for shadow DB (playbooks exist) and production (already archetypes)

-- Drop FKs that reference playbooks (no-op if already dropped)
ALTER TABLE "nation_moves" DROP CONSTRAINT IF EXISTS "nation_moves_playbookId_fkey";
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_playbookId_fkey";

-- Rename table only if playbooks exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'playbooks') THEN
    ALTER TABLE "playbooks" RENAME TO "archetypes";
  END IF;
END $$;

-- Rename players.playbookId only if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'playbookId') THEN
    ALTER TABLE "players" RENAME COLUMN "playbookId" TO "archetypeId";
  END IF;
END $$;

-- nation_moves: rename if playbookId exists, else add archetypeId
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nation_moves' AND column_name = 'playbookId') THEN
    ALTER TABLE "nation_moves" RENAME COLUMN "playbookId" TO "archetypeId";
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'nation_moves' AND column_name = 'archetypeId') THEN
    ALTER TABLE "nation_moves" ADD COLUMN "archetypeId" TEXT;
  END IF;
END $$;

-- quest_threads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quest_threads' AND column_name = 'allowedPlaybooks') THEN
    ALTER TABLE "quest_threads" RENAME COLUMN "allowedPlaybooks" TO "allowedArchetypes";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quest_threads' AND column_name = 'gatePlaybookId') THEN
    ALTER TABLE "quest_threads" RENAME COLUMN "gatePlaybookId" TO "gateArchetypeId";
  END IF;
END $$;

-- quest_packs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quest_packs' AND column_name = 'allowedPlaybooks') THEN
    ALTER TABLE "quest_packs" RENAME COLUMN "allowedPlaybooks" TO "allowedArchetypes";
  END IF;
END $$;

-- Recreate FKs (IF NOT EXISTS not supported; DROP first to be idempotent)
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_archetypeId_fkey";
ALTER TABLE "players" ADD CONSTRAINT "players_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "nation_moves" DROP CONSTRAINT IF EXISTS "nation_moves_archetypeId_fkey";
ALTER TABLE "nation_moves" ADD CONSTRAINT "nation_moves_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
