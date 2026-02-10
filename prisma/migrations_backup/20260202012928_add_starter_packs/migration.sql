-- AlterTable
ALTER TABLE "players" ADD COLUMN "attendance" TEXT;
ALTER TABLE "players" ADD COLUMN "pronouns" TEXT;

-- CreateTable
CREATE TABLE "starter_packs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "blessedObject" TEXT,
    "attunement" TEXT,
    "intention" TEXT,
    "cursedItem" TEXT,
    "commissionTitle" TEXT,
    "commissionDesc" TEXT,
    "signups" TEXT NOT NULL,
    "initialVibeulons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "starter_packs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "starter_packs_playerId_key" ON "starter_packs"("playerId");
