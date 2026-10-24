-- The council's weekly read of the unchosen lines (six-faces-council pass unchosen1, uc-who-reads B, 2026-10-21): one
-- pitch per returning pattern, composted when the pattern returns with a new one. One new table, nothing else touched.

-- CreateTable
CREATE TABLE "ttv_unchosen_pitches" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "week_of" DATE NOT NULL,
    "word" TEXT NOT NULL,
    "face" TEXT NOT NULL,
    "kernel" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    "quotes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'live',
    "composted_at" TIMESTAMP(3),
    "replaced_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ttv_unchosen_pitches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ttv_unchosen_pitches_player_id_status_idx" ON "ttv_unchosen_pitches"("player_id", "status");

-- CreateIndex
CREATE INDEX "ttv_unchosen_pitches_player_id_week_of_idx" ON "ttv_unchosen_pitches"("player_id", "week_of");
