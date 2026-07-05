-- Campaign Lead Forge: unified prospective-player leads (manual + automated funnel).
-- Spec: .specify/specs/campaign-lead-forge/spec.md
-- Additive: one new table + optional back-references. No existing columns altered.

CREATE TABLE "campaign_leads" (
  "id" TEXT NOT NULL,
  "campaignRef" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "status" TEXT NOT NULL DEFAULT 'new',
  "name" TEXT,
  "contact" TEXT,
  "channel" TEXT,
  "domain" TEXT,
  "superpower" TEXT,
  "superpowerOrientation" TEXT,
  "notes" TEXT,
  "actionsJson" TEXT,
  "starterQuestIdsJson" TEXT,
  "mythsSeenJson" TEXT,
  "forgedByPlayerId" TEXT,
  "claimedByPlayerId" TEXT,
  "inviteId" TEXT,
  "latentIntakeId" TEXT,
  "clientSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campaign_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaign_leads_inviteId_key" ON "campaign_leads"("inviteId");
CREATE UNIQUE INDEX "campaign_leads_latentIntakeId_key" ON "campaign_leads"("latentIntakeId");
CREATE INDEX "campaign_leads_campaignRef_status_idx" ON "campaign_leads"("campaignRef", "status");
CREATE INDEX "campaign_leads_campaignRef_createdAt_idx" ON "campaign_leads"("campaignRef", "createdAt");

ALTER TABLE "campaign_leads"
  ADD CONSTRAINT "campaign_leads_forgedByPlayerId_fkey"
  FOREIGN KEY ("forgedByPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_leads"
  ADD CONSTRAINT "campaign_leads_claimedByPlayerId_fkey"
  FOREIGN KEY ("claimedByPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_leads"
  ADD CONSTRAINT "campaign_leads_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_leads"
  ADD CONSTRAINT "campaign_leads_latentIntakeId_fkey"
  FOREIGN KEY ("latentIntakeId") REFERENCES "latent_allyship_intakes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
