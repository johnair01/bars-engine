-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "collapsedFromQuestId" TEXT,
ADD COLUMN IF NOT EXISTS "collapsedFromInstanceId" TEXT;

-- AddForeignKey (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_bars_collapsedFromQuestId_fkey'
  ) THEN
    ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_collapsedFromQuestId_fkey"
      FOREIGN KEY ("collapsedFromQuestId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_bars_collapsedFromInstanceId_fkey'
  ) THEN
    ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_collapsedFromInstanceId_fkey"
      FOREIGN KEY ("collapsedFromInstanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
