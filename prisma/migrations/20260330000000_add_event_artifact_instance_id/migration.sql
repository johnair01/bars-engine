-- AlterTable
ALTER TABLE "event_artifacts" ADD COLUMN "instance_id" TEXT;

-- CreateIndex
CREATE INDEX "event_artifacts_instance_id_idx" ON "event_artifacts"("instance_id");

-- AddForeignKey
ALTER TABLE "event_artifacts" ADD CONSTRAINT "event_artifacts_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
