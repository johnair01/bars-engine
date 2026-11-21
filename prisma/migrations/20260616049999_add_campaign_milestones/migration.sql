-- CreateTable: campaign_milestones
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "campaign_milestones" (
    "id" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "proposedByPlayerId" TEXT NOT NULL,
    "approvedByPlayerId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_milestones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "campaign_milestones_campaignRef_status_idx" ON "campaign_milestones"("campaignRef", "status");
