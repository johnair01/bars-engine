-- WAVE room runs opened from the Council Board.
--
-- Wendell, 2026-10-14 (board, ttv-skip-wave): "It should deposit me inside the WAVE room and we should move to
-- have the WAVE room be able to metabolize context specific charges and send the results to the board". The cave
-- page saves the run here at every step (POST /api/council/wave-runs); the council reads it back with
-- COUNCIL_MENU_TOKEN (GET /api/council/wave-runs).
--
-- One new table. No backfill. Idempotent.

CREATE TABLE IF NOT EXISTS "wave_room_runs" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "record" JSONB NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wave_room_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wave_room_runs_player_id_ref_key" ON "wave_room_runs"("player_id", "ref");
CREATE INDEX IF NOT EXISTS "wave_room_runs_player_id_saved_at_idx" ON "wave_room_runs"("player_id", "saved_at");
