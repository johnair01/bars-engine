-- Tap the Vein "Pull what's useful": when the pull first read the page and how many lines it offered. Never a sentence.
ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN "pulled_at" TIMESTAMP(3);
ALTER TABLE "tap_the_vein_daily_sessions" ADD COLUMN "pull_offer_count" INTEGER NOT NULL DEFAULT 0;
