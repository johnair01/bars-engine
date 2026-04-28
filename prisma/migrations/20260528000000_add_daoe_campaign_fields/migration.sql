-- DAOE Phase 3: Add personalityProfile (Player Personality Intake storage)
-- DAOE Phase 4: Add suspendedAt (Campaign suspension kill-switch)
-- Combined: no partial deploy window per spec decision
-- See: .specify/specs/daoe-integration/spec.md — Migration strategy

ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "personalityProfile" JSONB;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMPTZ;
