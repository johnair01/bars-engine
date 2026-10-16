-- The Nonprofit Board on bars-engine (six-faces-council board-off-vendor-quota, 2026-10-16).
--
-- The board's saves used to live in the claude.ai artifact store and reached GitHub only through a Claude routine,
-- which stalled on 2026-10-15 when the account ran out of tokens. They now live here, append-only, and a GitHub
-- Action records them on main. Two new tables, nothing else touched. Idempotent.

CREATE TABLE IF NOT EXISTS "board_saves" (
  "id"          TEXT NOT NULL,
  "board"       TEXT NOT NULL,
  "collection"  TEXT NOT NULL,
  "doc_id"      TEXT NOT NULL,
  "data"        JSONB NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recorded_at" TIMESTAMP(3),
  "record"      TEXT,
  "source"      TEXT NOT NULL DEFAULT 'board',
  CONSTRAINT "board_saves_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "board_saves_board_collection_doc_id_received_at_idx"
  ON "board_saves" ("board", "collection", "doc_id", "received_at");
CREATE INDEX IF NOT EXISTS "board_saves_board_recorded_at_idx" ON "board_saves" ("board", "recorded_at");

CREATE TABLE IF NOT EXISTS "board_pulls" (
  "id"       TEXT NOT NULL,
  "board"    TEXT NOT NULL,
  "at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recorded" INTEGER NOT NULL,
  "record"   TEXT NOT NULL,
  CONSTRAINT "board_pulls_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "board_pulls_board_at_idx" ON "board_pulls" ("board", "at");
