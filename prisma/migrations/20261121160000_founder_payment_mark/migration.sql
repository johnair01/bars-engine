-- Founder support demo (hole H-gm-mark): a payment the game master marked, one row per reference of his.
CREATE TABLE "founder_payment_marks" (
    "ref" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "cents" INTEGER NOT NULL,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "founder_payment_marks_pkey" PRIMARY KEY ("ref")
);
CREATE INDEX "founder_payment_marks_player_id_idx" ON "founder_payment_marks"("player_id");
