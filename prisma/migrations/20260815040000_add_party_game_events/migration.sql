-- Append-only party game record for the Goodbye Yellow Brick Road one-shot.
-- Hand, personal cycle, shared board, achievements, and GM feature/unlock state
-- are projections over this stream — no separate Hand/Board/Achievement tables.
-- See .specify/specs/goodbye-yellow-brick-road-party-one-shot/plan.md
CREATE TABLE "party_game_events" (
  "id" TEXT NOT NULL,
  "party_id" TEXT NOT NULL,
  "player_id" TEXT,
  "type" TEXT NOT NULL,
  "card_id" TEXT,
  "payload_json" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "party_game_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "party_game_events_party_id_createdAt_idx" ON "party_game_events"("party_id", "createdAt");
CREATE INDEX "party_game_events_party_id_player_id_createdAt_idx" ON "party_game_events"("party_id", "player_id", "createdAt");
CREATE INDEX "party_game_events_party_id_type_createdAt_idx" ON "party_game_events"("party_id", "type", "createdAt");
