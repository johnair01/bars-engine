-- Make adventureId nullable so character creator works standalone
ALTER TABLE "player_playbooks" ALTER COLUMN "adventureId" DROP NOT NULL;

-- Drop old cascade FK and re-add as nullable SET NULL
ALTER TABLE "player_playbooks" DROP CONSTRAINT IF EXISTS "player_playbooks_adventureId_fkey";
ALTER TABLE "player_playbooks"
  ADD CONSTRAINT "player_playbooks_adventureId_fkey"
  FOREIGN KEY ("adventureId") REFERENCES "adventures"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
