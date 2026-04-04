-- Campaign Self-Serve (CSS): L1 wizard + L2 skinning + L3 schema-ready
-- Instance:Campaign is 1:many. Steward+ creates → draft → admin reviews → live.

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'LIVE', 'ARCHIVED');

-- CreateTable: campaigns
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "allyshipDomain" TEXT,
    "wakeUpContent" TEXT,
    "showUpContent" TEXT,
    "storyBridgeCopy" TEXT,
    "questTemplateConfig" JSONB,
    "inviteConfig" JSONB,
    "narrativeConfig" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "instanceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable: campaign_themes
CREATE TABLE "campaign_themes" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "bgGradient" TEXT,
    "bgDeep" TEXT,
    "titleColor" TEXT,
    "accentPrimary" TEXT,
    "accentSecondary" TEXT,
    "accentTertiary" TEXT,
    "fontDisplayKey" TEXT,
    "posterImageUrl" TEXT,
    "cssVarOverrides" JSONB,
    "narrativeConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
CREATE INDEX "campaigns_instanceId_status_idx" ON "campaigns"("instanceId", "status");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE UNIQUE INDEX "campaign_themes_campaignId_key" ON "campaign_themes"("campaignId");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaign_themes" ADD CONSTRAINT "campaign_themes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
