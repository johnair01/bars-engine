-- Player feedback → durable BacklogItem (Share Your Signal, site-signal, cert)
ALTER TABLE "backlog_items" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "backlog_items" ADD COLUMN "submitted_by_player_id" TEXT;
ALTER TABLE "backlog_items" ADD COLUMN "context_json" TEXT;

CREATE INDEX "backlog_items_source_created_at_idx" ON "backlog_items"("source", "createdAt");

ALTER TABLE "backlog_items" ADD CONSTRAINT "backlog_items_submitted_by_player_id_fkey" FOREIGN KEY ("submitted_by_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
