-- CreateTable: NpcEncounter — lightweight join for NPC slot injection in spoke CYOA sessions
CREATE TABLE "npc_encounters" (
    "id" TEXT NOT NULL,
    "spokeSessionId" TEXT NOT NULL,
    "npcId" TEXT NOT NULL,
    "questId" TEXT,
    "departurePassageId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "npc_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "npc_encounters_spokeSessionId_idx" ON "npc_encounters"("spokeSessionId");

-- CreateIndex
CREATE INDEX "npc_encounters_npcId_idx" ON "npc_encounters"("npcId");

-- AddForeignKey
ALTER TABLE "npc_encounters" ADD CONSTRAINT "npc_encounters_spokeSessionId_fkey" FOREIGN KEY ("spokeSessionId") REFERENCES "spoke_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_encounters" ADD CONSTRAINT "npc_encounters_npcId_fkey" FOREIGN KEY ("npcId") REFERENCES "npc_constitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
