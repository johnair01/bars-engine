-- Ally Campaign: accountless participation, bounties, and offers to the collective.
--
-- Why this exists:
--   Friends and family need to run the /ally CYOA, claim scoped work, and offer
--   help WITHOUT creating a bars-engine account — while their information still
--   lands on the steward dashboard. The existing claim/offer primitives all
--   require a Player FK (MilestoneNeed.claimedByPlayerId, GameboardAidOffer's
--   three Player FKs), so there was no accountless seam. CampaignLead already
--   exists without a Player, so it becomes the accountless identity.
--
-- Three additive changes, no drops, no backfill:
--   1. milestone_needs  — claim by lead + bounty energy
--   2. campaign_leads   — parent-campaign rollup + vibeulon ledger
--   3. collective_offers — new table for unshaped offers to the collective
--
-- Written idempotently (IF NOT EXISTS / catalog guards) so it is safe to re-run
-- and safe to apply by hand via psql if `migrate deploy` is blocked by unrelated
-- history — see docs/PRISMA_MIGRATE_STRATEGY.md on the legacy chain.

-- ── 1. milestone_needs ──────────────────────────────────────────────────────
ALTER TABLE "milestone_needs" ADD COLUMN IF NOT EXISTS "claimed_by_lead_id" TEXT;
ALTER TABLE "milestone_needs" ADD COLUMN IF NOT EXISTS "bounty_vibeulons" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "milestone_needs_claimed_by_lead_id_idx"
  ON "milestone_needs" ("claimed_by_lead_id");

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS; guard on the catalog instead.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'milestone_needs_claimed_by_lead_id_fkey'
  ) THEN
    ALTER TABLE "milestone_needs"
      ADD CONSTRAINT "milestone_needs_claimed_by_lead_id_fkey"
      FOREIGN KEY ("claimed_by_lead_id") REFERENCES "campaign_leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 2. campaign_leads ───────────────────────────────────────────────────────
ALTER TABLE "campaign_leads" ADD COLUMN IF NOT EXISTS "parent_campaign_ref" TEXT;
ALTER TABLE "campaign_leads" ADD COLUMN IF NOT EXISTS "vibeulons_earned" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "campaign_leads_parent_campaign_ref_status_idx"
  ON "campaign_leads" ("parent_campaign_ref", "status");

-- ── 3. collective_offers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "collective_offers" (
  "id"                  TEXT NOT NULL,
  "campaignRef"         TEXT NOT NULL,
  "parent_campaign_ref" TEXT,
  "leadId"              TEXT,
  "playerId"            TEXT,
  "unit"                TEXT NOT NULL DEFAULT 'action',
  "value"               DOUBLE PRECISION NOT NULL DEFAULT 1,
  "body"                TEXT NOT NULL,
  "domain"              TEXT,
  "superpower"          TEXT,
  "status"              TEXT NOT NULL DEFAULT 'open',
  "shaped_need_id"      TEXT,
  "collective"          BOOLEAN NOT NULL DEFAULT true,
  "stewardNotes"        TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "collective_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "collective_offers_campaignRef_status_idx"
  ON "collective_offers" ("campaignRef", "status");
CREATE INDEX IF NOT EXISTS "collective_offers_parent_campaign_ref_status_idx"
  ON "collective_offers" ("parent_campaign_ref", "status");
CREATE INDEX IF NOT EXISTS "collective_offers_leadId_idx"
  ON "collective_offers" ("leadId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collective_offers_leadId_fkey'
  ) THEN
    ALTER TABLE "collective_offers"
      ADD CONSTRAINT "collective_offers_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "campaign_leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
