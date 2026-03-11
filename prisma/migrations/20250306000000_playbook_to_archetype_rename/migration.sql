-- Playbook → Archetype terminology rename (BA)
-- Preserves data by renaming table/columns instead of drop+create

-- Drop FKs that reference playbooks
ALTER TABLE "nation_moves" DROP CONSTRAINT IF EXISTS "nation_moves_playbookId_fkey";
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_playbookId_fkey";

-- Rename table
ALTER TABLE "playbooks" RENAME TO "archetypes";

-- Rename columns
ALTER TABLE "players" RENAME COLUMN "playbookId" TO "archetypeId";
ALTER TABLE "nation_moves" RENAME COLUMN "playbookId" TO "archetypeId";
ALTER TABLE "quest_threads" RENAME COLUMN "allowedPlaybooks" TO "allowedArchetypes";
ALTER TABLE "quest_threads" RENAME COLUMN "gatePlaybookId" TO "gateArchetypeId";
ALTER TABLE "quest_packs" RENAME COLUMN "allowedPlaybooks" TO "allowedArchetypes";

-- Recreate FKs
ALTER TABLE "players" ADD CONSTRAINT "players_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "nation_moves" ADD CONSTRAINT "nation_moves_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
