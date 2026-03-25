-- CSHE Phase A: clothing swap sub-campaign organizer intake + publish gate
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "swap_event_intake" JSONB;
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "swap_event_intake_published_at" TIMESTAMP(3);
