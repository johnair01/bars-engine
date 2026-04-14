-- AlterTable: optional parent campaign (subcampaign / initiative tree)
ALTER TABLE "campaigns" ADD COLUMN "parentCampaignId" TEXT;

-- CreateIndex
CREATE INDEX "campaigns_parentCampaignId_idx" ON "campaigns"("parentCampaignId");

-- AddForeignKey (ON DELETE SET NULL so deleting parent does not cascade-delete children)
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_parentCampaignId_fkey" FOREIGN KEY ("parentCampaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
