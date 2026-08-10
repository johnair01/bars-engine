-- Repair production drift on the Tap the Vein tables.
--
-- Why this exists:
--   20260624160338_add_tap_the_vein created "tap_the_vein_daily_sessions" and
--   "tap_the_vein_tasks" with the column set that schema.prisma still declares.
--   20260629124500_add_lenses_goal_onboarding then re-declared both tables with a
--   DIFFERENT (divergent-branch) column set that omits "lensFaceKey", "eaChannel"
--   and "chargeStrength". On databases where the second migration is the one that
--   actually created the tables, those three columns are absent, so every Prisma
--   read of TapTheVeinDailySession fails with P2022 and /tap-the-vein renders
--   "Failed to load today's ritual".
--
-- This migration is written to be idempotent and additive so it is safe on both
-- shapes (already-correct databases get a no-op) and safe to run by hand via psql
-- if `prisma migrate deploy` is blocked by unrelated history.
--
-- Deliberately NOT dropped here: "tap_the_vein_daily_sessions"."lensGoalId" and
-- "tap_the_vein_tasks"."lifeLensDomain". Both are nullable leftovers from the same
-- divergent definition and are unused by the app; removing them is destructive and
-- is left as a separate, reviewed decision.

ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN IF NOT EXISTS "lensFaceKey" TEXT;
ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN IF NOT EXISTS "eaChannel" TEXT;
ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN IF NOT EXISTS "chargeStrength" TEXT;

ALTER TABLE "tap_the_vein_tasks" ADD COLUMN IF NOT EXISTS "lensFaceKey" TEXT;

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS; guard on the catalog instead.
-- 20260629124500 only recreated the tasks -> sessions foreign key, so the
-- sessions -> players cascade can be missing on the drifted shape.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tap_the_vein_daily_sessions_playerId_fkey'
      AND conrelid = '"tap_the_vein_daily_sessions"'::regclass
  ) THEN
    ALTER TABLE "tap_the_vein_daily_sessions"
      ADD CONSTRAINT "tap_the_vein_daily_sessions_playerId_fkey"
      FOREIGN KEY ("playerId") REFERENCES "players"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
