-- CreateTable: bar_deck_cards
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "bar_deck_cards" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "suit" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "promptTitle" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "shufflePower" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_deck_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bar_deck_cards_deckId_idx" ON "bar_deck_cards"("deckId");

CREATE UNIQUE INDEX IF NOT EXISTS "bar_deck_cards_deckId_suit_rank_key" ON "bar_deck_cards"("deckId", "suit", "rank");
