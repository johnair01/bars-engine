-- Phase 6: optional capacity + recurrence placeholder for calendar / ops

ALTER TABLE "event_artifacts" ADD COLUMN IF NOT EXISTS "capacity" INTEGER;
ALTER TABLE "event_artifacts" ADD COLUMN IF NOT EXISTS "recurrence_rule" TEXT;
