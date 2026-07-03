-- HNTF: humane notifications preferences + audit log

ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "notification_prefs_json" TEXT;

CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "external_id" TEXT,
    "period_key" TEXT,
    "sent_at" TIMESTAMP(3),
    "metadata_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_logs_playerId_created_at_idx" ON "notification_logs"("playerId", "created_at");
CREATE INDEX IF NOT EXISTS "notification_logs_playerId_type_period_key_idx" ON "notification_logs"("playerId", "type", "period_key");

ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "notification_logs_playerId_fkey";
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
