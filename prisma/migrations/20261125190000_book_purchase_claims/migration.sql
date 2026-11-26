-- Proof-of-purchase claims for readers who bought the book outside Gumroad. One new table, nothing else touched.

-- CreateTable
CREATE TABLE "book_purchase_claims" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "note" TEXT,
    "image_data" BYTEA,
    "image_type" TEXT,
    "image_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decline_reason" TEXT,
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "entitlement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_purchase_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_purchase_claims_status_created_at_idx" ON "book_purchase_claims"("status", "created_at");

-- CreateIndex
CREATE INDEX "book_purchase_claims_player_id_idx" ON "book_purchase_claims"("player_id");

-- CreateIndex
CREATE INDEX "book_purchase_claims_image_hash_idx" ON "book_purchase_claims"("image_hash");
