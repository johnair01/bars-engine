-- Nested pre-production events under a main EventArtifact (e.g. dance party → crews).

ALTER TABLE "event_artifacts" ADD COLUMN IF NOT EXISTS "parent_event_artifact_id" TEXT;

CREATE INDEX IF NOT EXISTS "event_artifacts_parent_event_artifact_id_idx" ON "event_artifacts"("parent_event_artifact_id");

ALTER TABLE "event_artifacts" DROP CONSTRAINT IF EXISTS "event_artifacts_parent_event_artifact_id_fkey";

ALTER TABLE "event_artifacts" ADD CONSTRAINT "event_artifacts_parent_event_artifact_id_fkey"
  FOREIGN KEY ("parent_event_artifact_id") REFERENCES "event_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
