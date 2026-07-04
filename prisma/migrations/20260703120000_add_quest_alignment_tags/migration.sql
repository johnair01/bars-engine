-- Campaign Lead Forge Phase 7 (Quest Studio): queryable alignment tags on quests.
-- Additive: three nullable columns on custom_bars.
ALTER TABLE "custom_bars" ADD COLUMN "gmFace" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "superpowerAffinity" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "mythId" TEXT;
