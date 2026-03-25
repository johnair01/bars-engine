-- Fix: EIP fields belong on custom_bars (CustomBar), not bars (legacy Bar model).
-- See migration 20260326200000_add_custom_bar_partiful_event_slug (wrong table).
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "partifulUrl" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "eventSlug" TEXT;
