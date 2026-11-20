-- Founder support demo (hole H-payment-word): one payment-note word per player id; a word names one player.
CREATE TABLE "founder_payment_words" (
    "word" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "founder_payment_words_pkey" PRIMARY KEY ("word")
);
CREATE UNIQUE INDEX "founder_payment_words_player_id_key" ON "founder_payment_words"("player_id");
