-- Allyship Deck draw journal (Slice 5 — spec: allyship-deck-experience/spec.md).
-- One row per card drawn by a player. Streak computed from drawnAt dates client-side.
-- Vibeulons default 1; real quest-layer rewards added in a future migration.
CREATE TABLE "deck_journal_entries" (
    "id"        TEXT NOT NULL,
    "playerId"  TEXT NOT NULL,
    "cardId"    TEXT NOT NULL,
    "drawnAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vibeulons" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "deck_journal_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deck_journal_entries_playerId_drawnAt_idx"
    ON "deck_journal_entries"("playerId", "drawnAt" DESC);

ALTER TABLE "deck_journal_entries"
    ADD CONSTRAINT "deck_journal_entries_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
