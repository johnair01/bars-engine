-- CreateTable: daemons
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "daemons" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "moveIds" TEXT NOT NULL DEFAULT '[]',
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'METAL',
    "altitude" TEXT NOT NULL DEFAULT 'DISSATISFIED',
    "collective" BOOLEAN NOT NULL DEFAULT false,
    "communityScope" TEXT,

    CONSTRAINT "daemons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "daemons_playerId_idx" ON "daemons"("playerId");
