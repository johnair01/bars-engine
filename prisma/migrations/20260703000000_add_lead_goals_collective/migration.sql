-- Campaign Lead Forge Phase 6: owner goals per lead + publish-to-collective flag.
-- Additive: two nullable/defaulted columns on campaign_leads.
ALTER TABLE "campaign_leads" ADD COLUMN "goals" TEXT;
ALTER TABLE "campaign_leads" ADD COLUMN "collective" BOOLEAN NOT NULL DEFAULT false;
