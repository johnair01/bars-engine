-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "watering_progress" TEXT;

-- AlterTable
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "kernel_bar_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "instances_kernel_bar_id_key" ON "instances"("kernel_bar_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'instances_kernel_bar_id_fkey'
  ) THEN
    ALTER TABLE "instances" ADD CONSTRAINT "instances_kernel_bar_id_fkey" 
    FOREIGN KEY ("kernel_bar_id") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
