-- Campaign-scoped donation CTA: optional button label on Instance; event-level JSON overrides on EventArtifact
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "donationButtonLabel" TEXT;

ALTER TABLE "event_artifacts" ADD COLUMN IF NOT EXISTS "donationCtaOverrides" JSONB;
