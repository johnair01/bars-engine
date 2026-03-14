-- DropColumn: adventureType was removed from the Adventure model.
-- The column is no longer referenced by the application.
-- 8 rows have non-null values; dropping is safe (data is orphaned).
-- See: bruised-banana-residency-ship spec, db:sync blocker resolution.
-- Handles both "adventureType" (Prisma default) and "adventure_type" (snake_case).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adventures' AND column_name = 'adventureType') THEN
    ALTER TABLE "adventures" DROP COLUMN "adventureType";
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adventures' AND column_name = 'adventure_type') THEN
    ALTER TABLE "adventures" DROP COLUMN "adventure_type";
  END IF;
END $$;
