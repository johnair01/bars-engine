-- AlterTable
ALTER TABLE "latent_allyship_intakes" ADD COLUMN     "superpower" TEXT,
ADD COLUMN     "superpower_orientation" TEXT;

-- AlterTable
ALTER TABLE "campaign_memberships" ADD COLUMN     "superpower" TEXT,
ADD COLUMN     "superpowerOrientation" TEXT;

-- CreateTable
CREATE TABLE "milestone_needs" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "superpower" TEXT NOT NULL,
    "orientation" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'action',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "claimedByPlayerId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_needs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_needs_campaignRef_status_idx" ON "milestone_needs"("campaignRef", "status");

-- CreateIndex
CREATE INDEX "milestone_needs_milestoneId_idx" ON "milestone_needs"("milestoneId");

-- CreateIndex
CREATE INDEX "milestone_needs_claimedByPlayerId_idx" ON "milestone_needs"("claimedByPlayerId");

-- AddForeignKey
ALTER TABLE "milestone_needs" ADD CONSTRAINT "milestone_needs_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "campaign_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

