-- AlterTable: add spokeSessionId and playbookRole to player_playbooks
ALTER TABLE "player_playbooks" ADD COLUMN "spokeSessionId" TEXT;
ALTER TABLE "player_playbooks" ADD COLUMN "playbookRole" TEXT;

-- CreateIndex
CREATE INDEX "player_playbooks_spokeSessionId_idx" ON "player_playbooks"("spokeSessionId");
