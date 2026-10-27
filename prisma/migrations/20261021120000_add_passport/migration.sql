-- The Calrunian passport (six-faces-council pass calrunia-world1, cw-passport, 2026-10-21): one player record that crosses
-- Calrunia's places, claimed from the browser at sign-in. One new table, nothing else touched.

-- CreateTable
CREATE TABLE "passports" (
    "player_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "claimed_guest_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passports_pkey" PRIMARY KEY ("player_id")
);
