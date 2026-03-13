-- AlterTable: add agentMetadata to CustomBar
ALTER TABLE "custom_bars" ADD COLUMN "agentMetadata" TEXT;

-- CreateTable: HexagramEncounterLog
CREATE TABLE "hexagram_encounter_logs" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "hexagramId" INTEGER NOT NULL,
    "upperTrigram" TEXT NOT NULL,
    "lowerTrigram" TEXT NOT NULL,
    "isHomeTrigram" BOOLEAN NOT NULL DEFAULT false,
    "trigramPosition" TEXT,
    "interpretationSummary" TEXT,
    "archetypesInvolved" TEXT,
    "questOutcome" TEXT,
    "emotionalAlchemyTag" TEXT,
    "questId" TEXT,
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hexagram_encounter_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AgentInterpretiveProfile
CREATE TABLE "agent_interpretive_profiles" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "hexagramId" INTEGER,
    "profileText" TEXT NOT NULL,
    "encounterCount" INTEGER NOT NULL DEFAULT 0,
    "lastSynthesizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_interpretive_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_hexagram_encounter_logs_agent_hex" ON "hexagram_encounter_logs"("agentName", "hexagramId");

-- CreateIndex
CREATE INDEX "ix_hexagram_encounter_logs_agent_created" ON "hexagram_encounter_logs"("agentName", "createdAt");

-- CreateIndex
CREATE INDEX "ix_agent_interpretive_profiles_agent" ON "agent_interpretive_profiles"("agentName");

-- CreateIndex
CREATE UNIQUE INDEX "agent_interpretive_profiles_agentName_hexagramId_key" ON "agent_interpretive_profiles"("agentName", "hexagramId");
