-- CreateTable: npc_constitutions
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "npc_constitutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archetypalRole" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "constitutionVersion" TEXT NOT NULL DEFAULT '1.0',
    "identity" TEXT NOT NULL,
    "values" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "limits" TEXT NOT NULL,
    "memoryPolicy" TEXT NOT NULL,
    "reflectionPolicy" TEXT NOT NULL,
    "governedBy" TEXT NOT NULL DEFAULT 'regent_game_master',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentLocation" TEXT NOT NULL DEFAULT 'none',
    "linkedAdventures" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npc_constitutions_pkey" PRIMARY KEY ("id")
);
