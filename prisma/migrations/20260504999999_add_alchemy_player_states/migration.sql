-- CreateTable: alchemy_player_states
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "alchemy_player_states" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "altitude" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alchemy_player_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "alchemy_player_states_playerId_key" ON "alchemy_player_states"("playerId");
