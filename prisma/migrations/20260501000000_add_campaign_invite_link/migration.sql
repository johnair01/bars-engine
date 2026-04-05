-- AlterTable: Add campaignId to invites for campaign-specific invite links
ALTER TABLE "invites" ADD COLUMN "campaignId" TEXT;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
