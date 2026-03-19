-- AlterTable
ALTER TABLE "campaign_invitations" ADD COLUMN "event_artifact_id" TEXT;

-- CreateIndex
CREATE INDEX "campaign_invitations_event_artifact_id_idx" ON "campaign_invitations"("event_artifact_id");

-- AddForeignKey
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_event_artifact_id_fkey" FOREIGN KEY ("event_artifact_id") REFERENCES "event_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
