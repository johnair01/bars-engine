-- CreateTable
CREATE TABLE "nations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imgUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "nationId" TEXT,
    "playbookId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "players_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "players_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("contactType", "contactValue", "createdAt", "id", "inviteId", "name") SELECT "contactType", "contactValue", "createdAt", "id", "inviteId", "name" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_inviteId_key" ON "players"("inviteId");
CREATE UNIQUE INDEX "players_contactType_contactValue_key" ON "players"("contactType", "contactValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "nations_name_key" ON "nations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "playbooks_name_key" ON "playbooks"("name");
