-- CreateTable: ContributionAnnotation
-- CCV: GM-authored annotation marking a tracked action as a campaign contribution
CREATE TABLE "contribution_annotations" (
    "id" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "gmLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "contribution_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CampaignSlot
-- CCV: Sub-campaign slot for navigable hierarchy (campaign → branch → sub-branch → adventures)
CREATE TABLE "campaign_slots" (
    "id" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "parentSlotId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "adventureIds" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contribution_annotations_campaignRef_actionType_actionId_key" ON "contribution_annotations"("campaignRef", "actionType", "actionId");

-- CreateIndex
CREATE INDEX "contribution_annotations_campaignRef_status_idx" ON "contribution_annotations"("campaignRef", "status");

-- CreateIndex
CREATE INDEX "campaign_slots_campaignRef_parentSlotId_idx" ON "campaign_slots"("campaignRef", "parentSlotId");

-- CreateIndex
CREATE INDEX "campaign_slots_campaignRef_status_idx" ON "campaign_slots"("campaignRef", "status");

-- AddForeignKey
ALTER TABLE "contribution_annotations" ADD CONSTRAINT "contribution_annotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_slots" ADD CONSTRAINT "campaign_slots_parentSlotId_fkey" FOREIGN KEY ("parentSlotId") REFERENCES "campaign_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_slots" ADD CONSTRAINT "campaign_slots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
