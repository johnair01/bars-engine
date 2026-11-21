-- CreateTable: alchemy_check_ins, spoke_sessions
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "alchemy_check_ins" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "stucknessRating" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "altitude" TEXT NOT NULL,
    "sceneTypeChosen" TEXT,
    "sceneId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thresholdEncounterId" TEXT,

    CONSTRAINT "alchemy_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alchemy_check_ins_playerId_idx" ON "alchemy_check_ins"("playerId");

CREATE UNIQUE INDEX IF NOT EXISTS "alchemy_check_ins_playerId_date_key" ON "alchemy_check_ins"("playerId", "date");

CREATE TABLE IF NOT EXISTS "spoke_sessions" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "moveType" TEXT,
    "gmFace" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "barSeedIds" TEXT NOT NULL DEFAULT '[]',
    "generatedQuestId" TEXT,
    "moveChosenAt" TIMESTAMP(3),
    "faceChosenAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spoke_sessions_pkey" PRIMARY KEY ("id")
);
