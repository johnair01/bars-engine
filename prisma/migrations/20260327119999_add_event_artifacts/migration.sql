-- CreateTable: event_artifacts
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "event_artifacts" (
    "id" TEXT NOT NULL,
    "linkedCampaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "campaignContext" TEXT NOT NULL,
    "primaryDomain" TEXT NOT NULL,
    "secondaryDomain" TEXT,
    "targetArchetypes" TEXT NOT NULL DEFAULT '[]',
    "targetMoves" TEXT NOT NULL DEFAULT '[]',
    "developmentalLens" TEXT,
    "locationType" TEXT NOT NULL,
    "locationDetails" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "timezone" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'campaign_visible',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recordingUrl" TEXT,
    "createdByActorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "event_artifacts_linkedCampaignId_idx" ON "event_artifacts"("linkedCampaignId");

CREATE INDEX IF NOT EXISTS "event_artifacts_status_idx" ON "event_artifacts"("status");

CREATE INDEX IF NOT EXISTS "event_artifacts_startTime_idx" ON "event_artifacts"("startTime");
