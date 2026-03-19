-- AlterTable
ALTER TABLE "instances" ADD COLUMN "parent_instance_id" TEXT,
ADD COLUMN "linked_instance_id" TEXT;

-- AddForeignKey
ALTER TABLE "instances" ADD CONSTRAINT "instances_parent_instance_id_fkey" FOREIGN KEY ("parent_instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instances" ADD CONSTRAINT "instances_linked_instance_id_fkey" FOREIGN KEY ("linked_instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
