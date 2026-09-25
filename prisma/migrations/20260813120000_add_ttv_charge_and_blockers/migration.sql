-- Tap the Vein: charge assessment, blocker reporting, and persisted brainstorm.
--
-- Why this exists:
--   Player signal (5 rows in backlog_items, 2026-08-10 → 2026-08-13) asked for
--   three things the daily loop could not do:
--     1. "we need be abel to see the brainstormed taks hen we are choosing the 5
--        that will stay with us. Otherwise we'll have to pull from memory"
--        — the brainstorm lived in React state and died with the modal.
--     2. "we need a process for assessing how much charge each committed item
--        has and a link to do a process that can shrink the charge"
--        — no per-task charge existed, only a session-level chargeStrength.
--     3. "should move users into being able to report a blocker and add context
--        to the task as they are working on it. highlighting and overcoming
--        blockers is the main game"
--        — no blocker state, and no place for working context.
--
-- Four additive changes, no drops, no backfill, no rewrites of existing rows:
--   1. tap_the_vein_daily_sessions — persisted brainstorm candidate list
--   2. tap_the_vein_tasks          — charge level + note, blocked_at
--   3. tap_the_vein_task_notes     — new table: the context/blocker log
--   4. indexes
--
-- Written idempotently (IF NOT EXISTS / catalog guards) so it is safe to re-run
-- and safe to apply by hand, matching 20260811120000_add_ally_campaign_accountless.
-- The legacy chain is divergent — see docs/PRISMA_MIGRATE_STRATEGY.md.

-- ── 1. tap_the_vein_daily_sessions ──────────────────────────────────────────
ALTER TABLE "tap_the_vein_daily_sessions"
  ADD COLUMN IF NOT EXISTS "brainstorm_candidates" JSONB;

-- ── 2. tap_the_vein_tasks ───────────────────────────────────────────────────
ALTER TABLE "tap_the_vein_tasks"
  ADD COLUMN IF NOT EXISTS "charge_level" TEXT;

ALTER TABLE "tap_the_vein_tasks"
  ADD COLUMN IF NOT EXISTS "charge_note" TEXT;

ALTER TABLE "tap_the_vein_tasks"
  ADD COLUMN IF NOT EXISTS "blocked_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "tap_the_vein_tasks_playerId_blocked_at_idx"
  ON "tap_the_vein_tasks" ("playerId", "blocked_at");

-- ── 3. tap_the_vein_task_notes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tap_the_vein_task_notes" (
  "id"           TEXT         NOT NULL,
  "task_id"      TEXT         NOT NULL,
  "player_id"    TEXT         NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind"         TEXT         NOT NULL DEFAULT 'context',
  "body"         TEXT         NOT NULL,
  "charge_level" TEXT,

  CONSTRAINT "tap_the_vein_task_notes_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tap_the_vein_task_notes_task_id_fkey'
  ) THEN
    ALTER TABLE "tap_the_vein_task_notes"
      ADD CONSTRAINT "tap_the_vein_task_notes_task_id_fkey"
      FOREIGN KEY ("task_id") REFERENCES "tap_the_vein_tasks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 4. indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "tap_the_vein_task_notes_task_id_created_at_idx"
  ON "tap_the_vein_task_notes" ("task_id", "created_at");

CREATE INDEX IF NOT EXISTS "tap_the_vein_task_notes_player_id_kind_idx"
  ON "tap_the_vein_task_notes" ("player_id", "kind");
