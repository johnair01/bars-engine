-- NEV: link 321 sessions to originating charge_capture BAR for provenance + compost
ALTER TABLE "shadow_321_sessions" ADD COLUMN IF NOT EXISTS "chargeSourceBarId" TEXT;
