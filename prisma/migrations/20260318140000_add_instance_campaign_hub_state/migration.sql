-- Persist one I Ching-style hub draw per Kotter stage (8 spokes). @see campaign-hub-spoke-landing-architecture spec.
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "campaignHubState" JSONB;
