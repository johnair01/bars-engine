-- CreateTable
CREATE TABLE "bar_quest_links" (
    "id" TEXT NOT NULL,
    "sourceBarId" TEXT NOT NULL,
    "targetQuestId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'primary',
    "confidence" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "supportedBy" JSONB,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdByPlayerId" TEXT NOT NULL,
    "reviewedByPlayerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "campaignRef" TEXT,
    "instanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_quest_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_drafts" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "playerArc" JSONB NOT NULL,
    "campaignContext" JSONB NOT NULL,
    "structure" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_quest_links_sourceBarId_idx" ON "bar_quest_links"("sourceBarId");
CREATE INDEX "bar_quest_links_targetQuestId_idx" ON "bar_quest_links"("targetQuestId");
CREATE INDEX "bar_quest_links_createdByPlayerId_idx" ON "bar_quest_links"("createdByPlayerId");
CREATE INDEX "bar_quest_links_instanceId_idx" ON "bar_quest_links"("instanceId");
CREATE INDEX "bar_quest_links_campaignRef_idx" ON "bar_quest_links"("campaignRef");

CREATE INDEX "campaign_drafts_playerId_createdAt_idx" ON "campaign_drafts"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "bar_quest_links" ADD CONSTRAINT "bar_quest_links_sourceBarId_fkey" FOREIGN KEY ("sourceBarId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_quest_links" ADD CONSTRAINT "bar_quest_links_targetQuestId_fkey" FOREIGN KEY ("targetQuestId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_quest_links" ADD CONSTRAINT "bar_quest_links_createdByPlayerId_fkey" FOREIGN KEY ("createdByPlayerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_quest_links" ADD CONSTRAINT "bar_quest_links_reviewedByPlayerId_fkey" FOREIGN KEY ("reviewedByPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bar_quest_links" ADD CONSTRAINT "bar_quest_links_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_drafts" ADD CONSTRAINT "campaign_drafts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
