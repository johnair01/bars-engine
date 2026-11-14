-- Compose-and-validate: an authored quest names the belief it is against and a dated disproof.
-- Five nullable columns, no backfill. Existing rows stay null and are excluded from the
-- capability index rather than counted as unvalidated.
ALTER TABLE "custom_bars"
  ADD COLUMN "questBeliefKey" TEXT,
  ADD COLUMN "prediction" TEXT,
  ADD COLUMN "predictionDue" TIMESTAMP(3),
  ADD COLUMN "predictionOutcome" TEXT,
  ADD COLUMN "predictionFrozenAt" TIMESTAMP(3);

-- The capability index is a GROUP BY over this column.
CREATE INDEX "custom_bars_questBeliefKey_idx" ON "custom_bars"("questBeliefKey");
