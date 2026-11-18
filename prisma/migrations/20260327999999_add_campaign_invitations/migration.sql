-- CreateTable: campaign_invitations
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "campaign_invitations" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "targetActorId" TEXT NOT NULL,
    "invitedRole" TEXT NOT NULL,
    "acceptedRole" TEXT,
    "invitationType" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdByActorId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "campaign_invitations_instanceId_idx" ON "campaign_invitations"("instanceId");

CREATE INDEX IF NOT EXISTS "campaign_invitations_targetActorId_idx" ON "campaign_invitations"("targetActorId");

CREATE INDEX IF NOT EXISTS "campaign_invitations_status_idx" ON "campaign_invitations"("status");
