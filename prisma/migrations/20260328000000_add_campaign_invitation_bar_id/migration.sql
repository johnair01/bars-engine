-- AlterTable
ALTER TABLE "campaign_invitations" ADD COLUMN "barId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "campaign_invitations_barId_key" ON "campaign_invitations"("barId");

-- CreateIndex
CREATE INDEX "campaign_invitations_barId_idx" ON "campaign_invitations"("barId");

-- AddForeignKey
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
