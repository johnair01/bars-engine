/*
  Warnings:

  - You are about to drop the column `attunement` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `blessedObject` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `commissionDesc` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `commissionTitle` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `cursedItem` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `intention` on the `starter_packs` table. All the data in the column will be lost.
  - You are about to drop the column `signups` on the `starter_packs` table. All the data in the column will be lost.
  - Added the required column `data` to the `starter_packs` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_starter_packs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "initialVibeulons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "starter_packs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_starter_packs" ("createdAt", "id", "initialVibeulons", "playerId") SELECT "createdAt", "id", "initialVibeulons", "playerId" FROM "starter_packs";
DROP TABLE "starter_packs";
ALTER TABLE "new_starter_packs" RENAME TO "starter_packs";
CREATE UNIQUE INDEX "starter_packs_playerId_key" ON "starter_packs"("playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
