-- Live board, step 2 (six-faces-council council/callsheets/live-board-design.md): number the change log.
-- Every save in board_saves gets an ordered number that only goes up, so a page or script holding number N can ask for
-- everything after it. Existing saves are numbered in the order they arrived. Nothing else is touched.

CREATE SEQUENCE "board_saves_seq_seq" AS BIGINT;
ALTER TABLE "board_saves" ADD COLUMN "seq" BIGINT;

UPDATE "board_saves" b SET "seq" = o.n
FROM (SELECT "id", row_number() OVER (ORDER BY "received_at", "id") AS n FROM "board_saves") o
WHERE b."id" = o."id";

SELECT setval('"board_saves_seq_seq"', COALESCE((SELECT MAX("seq") FROM "board_saves"), 0) + 1, false);

ALTER TABLE "board_saves" ALTER COLUMN "seq" SET DEFAULT nextval('"board_saves_seq_seq"');
ALTER TABLE "board_saves" ALTER COLUMN "seq" SET NOT NULL;
ALTER SEQUENCE "board_saves_seq_seq" OWNED BY "board_saves"."seq";

CREATE UNIQUE INDEX "board_saves_seq_key" ON "board_saves"("seq");
CREATE INDEX "board_saves_board_seq_idx" ON "board_saves"("board", "seq");
