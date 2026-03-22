-- Prompt deck play state: global 5-slot hand + per-deck draw/discard (see .specify/specs/prompt-deck-draw-hand/)

CREATE TABLE "player_prompt_hands" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "handCardIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_prompt_hands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "player_prompt_hands_playerId_key" ON "player_prompt_hands"("playerId");

CREATE TABLE "prompt_deck_cycles" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "drawCardIds" TEXT NOT NULL DEFAULT '[]',
    "discardCardIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_deck_cycles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prompt_deck_cycles_playerId_deckId_key" ON "prompt_deck_cycles"("playerId", "deckId");

CREATE INDEX "prompt_deck_cycles_playerId_idx" ON "prompt_deck_cycles"("playerId");

ALTER TABLE "player_prompt_hands" ADD CONSTRAINT "player_prompt_hands_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_deck_cycles" ADD CONSTRAINT "prompt_deck_cycles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prompt_deck_cycles" ADD CONSTRAINT "prompt_deck_cycles_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "bar_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
