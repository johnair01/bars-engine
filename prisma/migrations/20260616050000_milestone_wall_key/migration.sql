-- AlterTable
ALTER TABLE "campaign_milestones" ADD COLUMN "wallKey" TEXT;

-- CreateIndex
CREATE INDEX "campaign_milestones_campaignRef_wallKey_idx" ON "campaign_milestones"("campaignRef", "wallKey");
