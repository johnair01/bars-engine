-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "passwordHash" TEXT,
    "onboardingMode" TEXT DEFAULT 'expert',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "storyProgress" TEXT,
    "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false,
    "hasCompletedFirstQuest" BOOLEAN NOT NULL DEFAULT false,
    "hasCreatedFirstQuest" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" DATETIME,
    "inviteId" TEXT NOT NULL,
    "nationId" TEXT,
    "playbookId" TEXT,
    "pronouns" TEXT,
    "attendance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "players_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "players_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "players_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_players" ("accountId", "attendance", "contactType", "contactValue", "createdAt", "id", "inviteId", "name", "nationId", "onboardingComplete", "onboardingMode", "passwordHash", "playbookId", "pronouns", "storyProgress") SELECT "accountId", "attendance", "contactType", "contactValue", "createdAt", "id", "inviteId", "name", "nationId", "onboardingComplete", "onboardingMode", "passwordHash", "playbookId", "pronouns", "storyProgress" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_contactType_contactValue_key" ON "players"("contactType", "contactValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
