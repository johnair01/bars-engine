-- Migration: add_iching_prompt_deck_engine
-- Issue: #47 Prompt Deck Engine
-- Date: 2026-05-20
-- Models: IChingCastEvent, IChingCard, Bar.promptTemplates

-- 1. Add promptTemplates column to bars table
ALTER TABLE "bars" ADD COLUMN "promptTemplates" TEXT NOT NULL DEFAULT '[]';

-- 2. Create iching_cast_events table
CREATE TABLE "iching_cast_events" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "hexagramId" INTEGER NOT NULL,
  "chosenFace" TEXT NOT NULL,
  "playerResponse" TEXT,
  "promptUsed" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'iching',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);

CREATE INDEX "iching_cast_events_playerId_createdAt_idx" ON "iching_cast_events"("playerId", "createdAt");
CREATE INDEX "iching_cast_events_hexagramId_idx" ON "iching_cast_events"("hexagramId");
CREATE INDEX "iching_cast_events_chosenFace_idx" ON "iching_cast_events"("chosenFace");
CREATE INDEX "iching_cast_events_hexagramId_chosenFace_idx" ON "iching_cast_events"("hexagramId", "chosenFace");

-- 3. Create iching_cards table
CREATE TABLE "iching_cards" (
  "id" TEXT NOT NULL,
  "deckId" TEXT NOT NULL,
  "barId" INTEGER NOT NULL,
  "cardIndex" INTEGER NOT NULL DEFAULT 0,
  "promptTemplate" TEXT NOT NULL DEFAULT '',
  "sourceType" TEXT NOT NULL DEFAULT 'iching',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "iching_cards_deckId_cardIndex_unique" ON "iching_cards"("deckId", "cardIndex");
CREATE INDEX "iching_cards_deckId_idx" ON "iching_cards"("deckId");
CREATE INDEX "iching_cards_barId_idx" ON "iching_cards"("barId");

-- 4. Add FK constraints
ALTER TABLE "iching_cast_events" ADD CONSTRAINT "iching_cast_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "iching_cast_events" ADD CONSTRAINT "iching_cast_events_hexagramId_fkey" FOREIGN KEY ("hexagramId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "iching_cards" ADD CONSTRAINT "iching_cards_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
