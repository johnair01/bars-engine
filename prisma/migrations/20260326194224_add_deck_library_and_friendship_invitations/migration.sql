-- CreateEnum
CREATE TYPE "DeckType" AS ENUM ('SCENE_ATLAS', 'FRIENDSHIP_52', 'FRIENDSHIP_64');

-- CreateTable: DeckLibrary (container for multiple BarDecks per Instance)
CREATE TABLE "deck_libraries" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_libraries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deck_libraries_instance_id_key" ON "deck_libraries"("instance_id");
CREATE INDEX "deck_libraries_instance_id_idx" ON "deck_libraries"("instance_id");

-- AddForeignKey
ALTER TABLE "deck_libraries" ADD CONSTRAINT "deck_libraries_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration Step 1: Create DeckLibrary for each Instance that has a BarDeck
INSERT INTO "deck_libraries" ("id", "instance_id", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text AS id,
    "instance_id",
    NOW() AS created_at,
    NOW() AS updated_at
FROM "bar_decks"
WHERE "instance_id" IS NOT NULL
GROUP BY "instance_id";

-- AlterTable: Add new columns to bar_decks
ALTER TABLE "bar_decks"
    ADD COLUMN "library_id" TEXT,
    ADD COLUMN "deck_type" "DeckType" NOT NULL DEFAULT 'SCENE_ATLAS';

-- Data Migration Step 2: Populate library_id from instance_id
UPDATE "bar_decks"
SET "library_id" = (
    SELECT "id"
    FROM "deck_libraries"
    WHERE "deck_libraries"."instance_id" = "bar_decks"."instance_id"
)
WHERE "instance_id" IS NOT NULL;

-- AlterTable: Make library_id NOT NULL and add constraints
ALTER TABLE "bar_decks" ALTER COLUMN "library_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "bar_decks_library_id_idx" ON "bar_decks"("library_id");
CREATE UNIQUE INDEX "bar_decks_library_id_deck_type_key" ON "bar_decks"("library_id", "deck_type");

-- AddForeignKey
ALTER TABLE "bar_decks" ADD CONSTRAINT "bar_decks_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "deck_libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey (if exists)
ALTER TABLE "bar_decks" DROP CONSTRAINT IF EXISTS "bar_decks_instance_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "bar_decks_instance_id_key";

-- AlterTable: Drop old instance_id column
ALTER TABLE "bar_decks" DROP COLUMN "instance_id";

-- CreateTable: FriendshipInvitation
CREATE TABLE "friendship_invitations" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "friend_phone" TEXT,
    "card_id" TEXT NOT NULL,
    "custom_prompt" TEXT,
    "personal_message" TEXT NOT NULL,
    "campaign_instance_id" TEXT NOT NULL,
    "invitation_bar_id" TEXT NOT NULL,
    "share_token" TEXT NOT NULL,
    "vibeulon_cost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "completed_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendship_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendship_invitations_share_token_key" ON "friendship_invitations"("share_token");
CREATE INDEX "friendship_invitations_sender_id_created_at_idx" ON "friendship_invitations"("sender_id", "created_at");
CREATE INDEX "friendship_invitations_campaign_instance_id_idx" ON "friendship_invitations"("campaign_instance_id");
CREATE INDEX "friendship_invitations_share_token_idx" ON "friendship_invitations"("share_token");
CREATE INDEX "friendship_invitations_status_idx" ON "friendship_invitations"("status");

-- AddForeignKey
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "bar_deck_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_campaign_instance_id_fkey" FOREIGN KEY ("campaign_instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_invitation_bar_id_fkey" FOREIGN KEY ("invitation_bar_id") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
