-- Go Deeper Slice 1: persist a player's superpower loadout (inner + outer) and
-- when the superpower quiz was last completed. Additive, nullable columns.
ALTER TABLE "players" ADD COLUMN     "superpowerInner" TEXT;
ALTER TABLE "players" ADD COLUMN     "superpowerOuter" TEXT;
ALTER TABLE "players" ADD COLUMN     "quizCompletedAt" TIMESTAMP(3);
