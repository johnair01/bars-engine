-- CreateEnum
CREATE TYPE "DeckType" AS ENUM ('SCENE_ATLAS', 'FRIENDSHIP_52', 'FRIENDSHIP_64');

-- CreateTable: DeckLibrary (container for multiple BarDecks per Instance)
-- Column names match Prisma model DeckLibrary (camelCase; @@map("deck_libraries")).
CREATE TABLE "deck_libraries" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deck_libraries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deck_libraries_instanceId_key" ON "deck_libraries"("instanceId");
CREATE INDEX "deck_libraries_instanceId_idx" ON "deck_libraries"("instanceId");

ALTER TABLE "deck_libraries" ADD CONSTRAINT "deck_libraries_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration Step 1: Create DeckLibrary for each Instance that has a BarDeck
-- bar_decks uses Prisma default column name "instanceId" (not instance_id).
INSERT INTO "deck_libraries" ("id", "instanceId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text AS id,
    bd."instanceId",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM "bar_decks" bd
WHERE bd."instanceId" IS NOT NULL
GROUP BY bd."instanceId";

-- AlterTable: Add new columns to bar_decks
ALTER TABLE "bar_decks"
    ADD COLUMN "libraryId" TEXT,
    ADD COLUMN "deckType" "DeckType" NOT NULL DEFAULT 'SCENE_ATLAS';

-- Data Migration Step 2: Populate libraryId from DeckLibrary
UPDATE "bar_decks" bd
SET "libraryId" = (
    SELECT dl."id"
    FROM "deck_libraries" dl
    WHERE dl."instanceId" = bd."instanceId"
)
WHERE bd."instanceId" IS NOT NULL;

ALTER TABLE "bar_decks" ALTER COLUMN "libraryId" SET NOT NULL;

CREATE INDEX "bar_decks_libraryId_idx" ON "bar_decks"("libraryId");
CREATE UNIQUE INDEX "bar_decks_libraryId_deckType_key" ON "bar_decks"("libraryId", "deckType");

ALTER TABLE "bar_decks" ADD CONSTRAINT "bar_decks_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "deck_libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bar_decks" DROP CONSTRAINT IF EXISTS "bar_decks_instanceId_fkey";
ALTER TABLE "bar_decks" DROP CONSTRAINT IF EXISTS "bar_decks_instance_id_fkey";

DROP INDEX IF EXISTS "bar_decks_instanceId_key";
DROP INDEX IF EXISTS "bar_decks_instance_id_key";

ALTER TABLE "bar_decks" DROP COLUMN IF EXISTS "instanceId";
ALTER TABLE "bar_decks" DROP COLUMN IF EXISTS "instance_id";

-- CreateTable: FriendshipInvitation (camelCase columns per Prisma model)
CREATE TABLE "friendship_invitations" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "friendPhone" TEXT,
    "cardId" TEXT NOT NULL,
    "customPrompt" TEXT,
    "personalMessage" TEXT NOT NULL,
    "campaignInstanceId" TEXT NOT NULL,
    "invitationBarId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "vibeulonCost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendship_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friendship_invitations_shareToken_key" ON "friendship_invitations"("shareToken");
CREATE INDEX "friendship_invitations_senderId_createdAt_idx" ON "friendship_invitations"("senderId", "createdAt");
CREATE INDEX "friendship_invitations_campaignInstanceId_idx" ON "friendship_invitations"("campaignInstanceId");
CREATE INDEX "friendship_invitations_shareToken_idx" ON "friendship_invitations"("shareToken");
CREATE INDEX "friendship_invitations_status_idx" ON "friendship_invitations"("status");

ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "bar_deck_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_campaignInstanceId_fkey" FOREIGN KEY ("campaignInstanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_invitationBarId_fkey" FOREIGN KEY ("invitationBarId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendship_invitations" ADD CONSTRAINT "friendship_invitations_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
