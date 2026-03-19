-- AlterTable
ALTER TABLE "quest_threads" ADD COLUMN "instanceId" TEXT;

-- AddForeignKey
ALTER TABLE "quest_threads" ADD CONSTRAINT "quest_threads_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
