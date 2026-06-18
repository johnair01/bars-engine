-- IOA base layer: the inner/outer aspect belongs to the base BAR move (CustomBar),
-- a sibling of moveType, recorded Nation-free. Additive + nullable: no backfill.
-- The Phase 4 columns on quest_move_logs remain as a demoted Nation-path echo.
-- See .specify/specs/inner-outer-allyship-moves/data-model.md
ALTER TABLE "custom_bars" ADD COLUMN "moveAspect" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "allyshipTarget" TEXT;
