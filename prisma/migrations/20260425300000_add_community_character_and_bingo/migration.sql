-- AlterTable: add communityCharacterCorpus to instances
ALTER TABLE "instances" ADD COLUMN "community_character_corpus" JSONB;

-- AlterTable: add bingoConfig to event_artifacts
ALTER TABLE "event_artifacts" ADD COLUMN "bingo_config" JSONB;

-- CreateTable: event_bingo_cards
CREATE TABLE "event_bingo_cards" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "campaign_ref" TEXT NOT NULL,
    "squares" JSONB NOT NULL DEFAULT '[]',
    "completed_lines" JSONB NOT NULL DEFAULT '[]',
    "prize_claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_bingo_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_bingo_cards_player_id_event_id_key" ON "event_bingo_cards"("player_id", "event_id");

-- CreateIndex
CREATE INDEX "event_bingo_cards_player_id_idx" ON "event_bingo_cards"("player_id");

-- CreateIndex
CREATE INDEX "event_bingo_cards_event_id_campaign_ref_idx" ON "event_bingo_cards"("event_id", "campaign_ref");

-- AddForeignKey
ALTER TABLE "event_bingo_cards" ADD CONSTRAINT "event_bingo_cards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bingo_cards" ADD CONSTRAINT "event_bingo_cards_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
