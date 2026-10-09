-- Tap the Vein: the morning menu (TTV-MENU).
--
-- Wendell, 2026-10-09 (council board, mm-where / mm-raw / mm-menu-shape): the free
-- write happens in Tap the Vein, only kept lines leave it, and every menu item
-- carries a bridge to a Lens goal. Bridges for committed tasks live on the task
-- row (lens_goal_id); this column holds bridges for kept lines that were never
-- committed, and the frozen menu the council reads once he seals it.
--
-- One additive, nullable column. No backfill. Idempotent, matching
-- 20260813120000_add_ttv_charge_and_blockers.

ALTER TABLE "tap_the_vein_daily_sessions"
  ADD COLUMN IF NOT EXISTS "morning_menu" JSONB;
