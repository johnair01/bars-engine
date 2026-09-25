-- MTGOA Day 10 — the Show Up handoff submission.
--
-- Why this exists:
--   Day 10 keeps everything a reader writes in the browser. This table holds the
--   one thing that can leave the device: a final artifact the reader reviewed
--   field by field and chose to send to the Campaign Stewards. The private half
--   of the day has no column here, so it cannot arrive by accident.
--
--   Accountless, following collective_offers: campaign_leads carries name and
--   contact, and only when the sender asked for a response and consented. An
--   anonymous submission has lead_id NULL and creates no contact record.
--
-- Retention (founder decision, 2026-08-27): kept until the sender withdraws.
--   Withdrawing deletes the lead row — hence ON DELETE SET NULL below — and
--   nulls sender_region, which leaves this row as an anonymous campaign record.
--   Honoring the rule is a delete rather than a column-by-column scrub, which is
--   why contact lives on the lead and not here.
--
-- One additive change, no drops, no backfill. Written idempotently
-- (IF NOT EXISTS / catalog guards) so it is safe to re-run and safe to apply by
-- hand via psql if `migrate deploy` is blocked by unrelated history — see
-- docs/PRISMA_MIGRATE_STRATEGY.md on the legacy chain.

CREATE TABLE IF NOT EXISTS "show_up_handoff_submissions" (
  "id"                     TEXT NOT NULL,
  "campaign_ref"           TEXT NOT NULL,
  "parent_campaign_ref"    TEXT,
  "source"                 TEXT NOT NULL DEFAULT 'course-day-10',

  "lane"                   TEXT NOT NULL,
  "face"                   TEXT,
  "domain"                 TEXT,

  "title"                  TEXT NOT NULL,
  "purpose"                TEXT,
  "next_action"            TEXT,
  "owner"                  TEXT,
  "terms"                  TEXT,
  "return_plan"            TEXT,

  "placement_state"        TEXT NOT NULL,
  "placement_kind"         TEXT,

  "steward_request"        TEXT NOT NULL,
  "note"                   TEXT,
  "placement_learning"     TEXT,

  "lead_id"                TEXT,
  "sender_region"          TEXT,
  "consent_to_contact"     BOOLEAN NOT NULL DEFAULT false,
  "consented_at"           TIMESTAMP(3),

  "status"                 TEXT NOT NULL DEFAULT 'new',
  "reviewed_by_player_id"  TEXT,
  "steward_note"           TEXT,

  -- SHA-256 of the one-time sender-control token. The raw token is shown once
  -- and never stored, so a database read cannot reach anybody's handoff link.
  "withdrawal_token_hash"  TEXT NOT NULL,
  "withdrawn_at"           TIMESTAMP(3),

  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL,

  CONSTRAINT "show_up_handoff_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "show_up_handoff_submissions_withdrawal_token_hash_key"
  ON "show_up_handoff_submissions" ("withdrawal_token_hash");

CREATE INDEX IF NOT EXISTS "show_up_handoff_submissions_campaign_ref_status_idx"
  ON "show_up_handoff_submissions" ("campaign_ref", "status");

CREATE INDEX IF NOT EXISTS "show_up_handoff_submissions_status_created_at_idx"
  ON "show_up_handoff_submissions" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "show_up_handoff_submissions_lead_id_idx"
  ON "show_up_handoff_submissions" ("lead_id");

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS; guard on the catalog instead.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'show_up_handoff_submissions_lead_id_fkey'
  ) THEN
    ALTER TABLE "show_up_handoff_submissions"
      ADD CONSTRAINT "show_up_handoff_submissions_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "campaign_leads"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
