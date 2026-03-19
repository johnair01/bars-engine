-- Idempotent backfill for CustomBar.isExemplar.
-- Fixes DBs where 20260330000001 was not applied but later migrations were (or schema was pushed partially).

ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "isExemplar" BOOLEAN NOT NULL DEFAULT false;
